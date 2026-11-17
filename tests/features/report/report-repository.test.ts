import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  bucket: "",
  download: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  createSignedUrls: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  supabaseServer: () => ({
    storage: {
      from: (bucket: string) => {
        storage.bucket = bucket;
        return storage;
      },
    },
  }),
}));

import {
  createPhotoUploadUrl,
  downloadPhoto,
  signPhotoUrls,
} from "@/features/report/server/report-repository";

const path = "2026/11/17/11111111-1111-1111-1111-111111111111.jpg";

beforeEach(() => {
  storage.bucket = "";
  vi.clearAllMocks();
});

describe("report storage calls", () => {
  it("downloads the photo bytes from the private bucket", async () => {
    storage.download.mockResolvedValue({
      data: new Blob([new Uint8Array([1, 2, 3])]),
      error: null,
    });
    expect(Array.from(await downloadPhoto(path))).toEqual([1, 2, 3]);
    expect(storage.bucket).toBe("laporan");
    expect(storage.download).toHaveBeenCalledWith(path);
  });

  it("throws when the photo is missing", async () => {
    storage.download.mockResolvedValue({ data: null, error: new Error("404") });
    await expect(downloadPhoto(path)).rejects.toThrow("photo not found");
  });

  it("returns the signed upload url and token for one path", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: "https://s/upload", token: "t", path },
      error: null,
    });
    await expect(createPhotoUploadUrl(path)).resolves.toEqual({
      signedUrl: "https://s/upload",
      token: "t",
    });
    expect(storage.bucket).toBe("laporan");
    expect(storage.createSignedUploadUrl).toHaveBeenCalledWith(path);
  });

  it("throws when the bucket cannot sign an upload", async () => {
    const error = new Error("Bucket not found");
    storage.createSignedUploadUrl.mockResolvedValue({ data: null, error });
    await expect(createPhotoUploadUrl(path)).rejects.toBe(error);
  });
});

describe("signPhotoUrls", () => {
  it("signs every feed photo in one call and maps the urls by path", async () => {
    const other = "2026/11/17/22222222-2222-2222-2222-222222222222.png";
    storage.createSignedUrls.mockResolvedValue({
      data: [
        { path, signedUrl: "https://s/a", error: null },
        { path: other, signedUrl: "https://s/b", error: null },
      ],
      error: null,
    });
    const urls = await signPhotoUrls([path, other]);
    expect(storage.createSignedUrls).toHaveBeenCalledTimes(1);
    expect(storage.createSignedUrls).toHaveBeenCalledWith([path, other], 3600);
    expect(urls.get(path)).toBe("https://s/a");
    expect(urls.get(other)).toBe("https://s/b");
  });

  it("makes no call for an empty feed", async () => {
    expect((await signPhotoUrls([])).size).toBe(0);
    expect(storage.createSignedUrls).not.toHaveBeenCalled();
  });

  it("returns no urls instead of failing the feed when signing fails", async () => {
    storage.createSignedUrls.mockResolvedValue({
      data: null,
      error: new Error("storage down"),
    });
    expect((await signPhotoUrls([path])).size).toBe(0);
  });
});
