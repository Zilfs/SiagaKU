import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/risk/level";
import type {
  DisabilityType,
  GoKitItem,
  PlanRequest,
  PreparednessPlan,
  ReadinessLevel,
} from "./schemas";

/** District facts the prompt and the base plan need; mapped from the risk detail. */
export type PlanDistrict = {
  name: string;
  city: string;
  level: RiskLevel;
  score: number;
  tidalFloodProne: boolean;
  maxRainfallMm: number | null;
  /** One short flood history sentence, or an empty string. */
  floodSummary: string;
};

const READINESS: Record<RiskLevel, ReadinessLevel> = {
  low: "advisory",
  moderate: "advisory",
  high: "watch",
  very_high: "warning",
};

const DISABILITY_LABELS: Record<DisabilityType, string> = {
  wheelchair_user: "pengguna kursi roda",
  blind: "tunanetra",
  deaf: "tunarungu",
  intellectual: "disabilitas intelektual",
  other: "disabilitas lain",
};

const BASE_GO_KIT: GoKitItem[] = [
  {
    item: "Air minum",
    quantity: "3 liter per orang per hari, untuk 3 hari",
    audience: "semua",
    priority: "required",
    reason: "Air bersih sering tidak tersedia saat banjir.",
  },
  {
    item: "Makanan siap saji",
    quantity: "Untuk 3 hari",
    audience: "semua",
    priority: "required",
    reason: "Tidak perlu dimasak saat listrik atau dapur terganggu.",
  },
  {
    item: "Lampu senter dan baterai cadangan",
    quantity: "1 set",
    audience: "semua",
    priority: "required",
    reason: "Listrik sering padam saat banjir.",
  },
  {
    item: "Power bank terisi penuh",
    quantity: "1 buah",
    audience: "semua",
    priority: "important",
    reason: "Menjaga ponsel tetap hidup untuk meminta bantuan.",
  },
  {
    item: "Kotak P3K",
    quantity: "1 kotak",
    audience: "semua",
    priority: "required",
    reason: "Luka kecil bisa terjadi saat evakuasi.",
  },
  {
    item: "Obat pribadi",
    quantity: "Stok 3 hari",
    audience: "semua",
    priority: "required",
    reason: "Akses ke apotek bisa terputus saat banjir.",
  },
  {
    item: "Salinan dokumen penting dalam plastik kedap air",
    quantity: "1 set",
    audience: "semua",
    priority: "required",
    reason: "KTP, KK, dan kartu BPJS dibutuhkan saat mengungsi.",
  },
  {
    item: "Uang tunai secukupnya",
    quantity: "Secukupnya",
    audience: "semua",
    priority: "important",
    reason: "ATM dan pembayaran digital bisa mati saat listrik padam.",
  },
  {
    item: "Pakaian kering dan selimut",
    quantity: "1 set per orang",
    audience: "semua",
    priority: "important",
    reason: "Tubuh perlu tetap hangat setelah terkena air banjir.",
  },
  {
    item: "Masker dan hand sanitizer",
    quantity: "1 pak",
    audience: "semua",
    priority: "important",
    reason: "Air banjir membawa kuman dan bau.",
  },
  {
    item: "Peluit",
    quantity: "1 per orang",
    audience: "semua",
    priority: "optional",
    reason: "Suara peluit lebih mudah didengar tim penyelamat.",
  },
  {
    item: "Tas atau wadah kedap air",
    quantity: "1 besar",
    audience: "semua",
    priority: "required",
    reason: "Menjaga isi tas siaga tetap kering.",
  },
  {
    item: "Pembuka kaleng dan alat makan",
    quantity: "1 set",
    audience: "semua",
    priority: "optional",
    reason: "Memudahkan makan makanan darurat.",
  },
  {
    item: "Nomor penting yang ditulis di kertas",
    quantity: "1 lembar",
    audience: "semua",
    priority: "important",
    reason: "Tetap bisa dihubungi saat ponsel kehabisan daya.",
  },
];

function memberItems(input: PlanRequest): GoKitItem[] {
  const items: GoKitItem[] = [];
  const m = input.members;

  if (m.infants > 0) {
    items.push(
      {
        item: "Susu formula atau MPASI",
        quantity: "Stok 3 hari",
        audience: "bayi",
        priority: "required",
        reason: "Bayi tetap perlu makan walau dapur tidak bisa dipakai.",
      },
      {
        item: "Popok dan kain bersih",
        quantity: "Stok 3 hari",
        audience: "bayi",
        priority: "required",
        reason: "Menjaga bayi tetap bersih dan sehat.",
      },
      {
        item: "Botol dan air matang",
        quantity: "1 set",
        audience: "bayi",
        priority: "important",
        reason: "Air keran tidak aman dipakai saat banjir.",
      },
    );
  }

  if (m.elderly > 0) {
    items.push(
      {
        item: "Obat rutin lansia",
        quantity: "Stok 3 hari",
        audience: "lansia",
        priority: "required",
        reason: "Obat rutin tidak boleh terputus saat mengungsi.",
      },
      {
        item: "Kacamata dan alat bantu dengar",
        quantity: "1 set",
        audience: "lansia",
        priority: "important",
        reason: "Memudahkan lansia saat evakuasi.",
      },
    );
  }

  if (m.pregnant > 0) {
    items.push(
      {
        item: "Buku KIA dan catatan kehamilan",
        quantity: "1 buku",
        audience: "ibu hamil",
        priority: "required",
        reason: "Petugas kesehatan perlu riwayat kehamilan.",
      },
      {
        item: "Pakaian longgar dan pembalut",
        quantity: "1 set",
        audience: "ibu hamil",
        priority: "important",
        reason: "Kebutuhan ibu hamil bisa mendadak.",
      },
    );
  }

  const disabilities = [...new Set(m.disabilities.map((d) => d.type))];
  for (const type of disabilities) {
    const label = DISABILITY_LABELS[type];
    items.push({
      item:
        type === "wheelchair_user"
          ? "Kursi roda dan roda cadangan"
          : type === "blind"
            ? "Tongkat dan alat bantu orientasi"
            : type === "deaf"
              ? "Alat bantu dengar dan alat tulis"
              : "Alat bantu dan catatan pendamping",
      quantity: "1 set",
      audience: label,
      priority: "required",
      reason: `Alat bantu ${label} harus ikut saat mengungsi.`,
    });
  }

  if (m.routineMedicine > 0) {
    items.push({
      item: "Obat rutin anggota keluarga",
      quantity: "Stok 3 hari",
      audience: "semua",
      priority: "required",
      reason: "Stok obat perlu cukup sampai layanan kesehatan pulih.",
    });
  }

  if (m.pets.length > 0) {
    items.push({
      item: "Pakan hewan peliharaan",
      quantity: "Stok 3 hari",
      audience: "hewan",
      priority: "important",
      reason: "Hewan peliharaan tetap perlu makan saat mengungsi.",
    });
    items.push({
      item: "Kandang atau tali hewan",
      quantity: "1 buah",
      audience: "hewan",
      priority: "optional",
      reason: "Menjaga hewan tetap aman dan tidak lepas.",
    });
  }

  if (m.children > 0) {
    items.push({
      item: "Mainan kecil atau buku anak",
      quantity: "1 per anak",
      audience: "anak",
      priority: "optional",
      reason: "Membantu anak tetap tenang di tempat pengungsian.",
    });
  }

  return items;
}

function vulnerableGroups(
  input: PlanRequest,
): PreparednessPlan["vulnerableGroups"] {
  const groups: PreparednessPlan["vulnerableGroups"] = [];
  const m = input.members;

  if (m.infants > 0) {
    groups.push({
      group: "bayi",
      notes: [
        "Bawa susu, MPASI, popok, dan air matang.",
        "Siapkan kain gendongan agar bayi tetap dekat.",
      ],
    });
  }
  if (m.elderly > 0) {
    groups.push({
      group: "lansia",
      notes: [
        "Bawa obat rutin dan alat bantu.",
        "Satu anggota keluarga mendampingi saat evakuasi.",
      ],
    });
  }
  if (m.pregnant > 0) {
    groups.push({
      group: "ibu hamil",
      notes: [
        "Segera ke fasilitas kesehatan bila ada tanda bahaya.",
        "Bawa buku KIA dan catatan pemeriksaan.",
      ],
    });
  }
  for (const type of [...new Set(m.disabilities.map((d) => d.type))]) {
    groups.push({
      group: DISABILITY_LABELS[type],
      notes: [
        "Tetapkan satu pendamping khusus saat evakuasi.",
        "Bawa alat bantu dan pastikan jalur evakuasi bisa dilalui.",
      ],
    });
  }
  if (m.pets.length > 0) {
    groups.push({
      group: "hewan peliharaan",
      notes: [
        "Bawa pakan, kandang, dan tali.",
        "Tanyakan ke posko apakah hewan boleh masuk.",
      ],
    });
  }

  return groups;
}

/**
 * Rule-based plan used when every AI provider fails (docs/05 §2.4). It must
 * pass PreparednessPlanSchema, so the result never depends on the model.
 */
export function buildBasePlan(
  input: PlanRequest,
  district: PlanDistrict,
  safePointIds: number[],
): PreparednessPlan {
  const m = input.members;
  const total = m.adults + m.children + m.infants + m.elderly + m.pregnant;
  const nearRiver = input.conditions.riverDistance === "close";
  const level = RISK_LEVEL_LABELS[district.level];

  const summary =
    `Rencana siaga untuk ${total} anggota keluarga di ${district.name}, ${district.city}. ` +
    `Risiko banjir hari ini ${level} (${district.score}/100)` +
    (nearRiver ? " dan rumah berada dekat sungai." : ".") +
    (district.floodSummary ? ` Riwayat: ${district.floodSummary}.` : "");

  const goKit = [...BASE_GO_KIT, ...memberItems(input)]
    .map((item) => ({ ...item }))
    .slice(0, 30);

  return {
    summary: summary.slice(0, 400),
    recommendedReadinessLevel: READINESS[district.level],
    goKit,
    before: [
      "Simpan tas siaga di tempat yang mudah dijangkau dan kering.",
      "Catat nomor penting keluarga dan tetangga di kertas.",
      "Periksa saluran air di sekitar rumah agar tidak tersumbat.",
      "Pindahkan dokumen dan barang berharga ke tempat tinggi.",
      nearRiver
        ? "Siapkan rencana mengungsi lebih awal karena rumah dekat sungai."
        : "Tentukan jalur evakuasi dan titik temu keluarga.",
      "Isi daya ponsel dan power bank sebelum hujan besar.",
      "Ikuti info cuaca dan peringatan resmi dari BMKG atau BPBD.",
    ],
    during: [
      "Jika air mulai masuk, utamakan keselamatan dan segera evakuasi.",
      "Matikan listrik dan gas sebelum meninggalkan rumah bila aman.",
      "Bawa tas siaga dan dokumen penting.",
      "Jangan melewati arus air yang deras, termasuk dengan motor.",
      "Jauhkan anak-anak dari saluran air dan arus listrik.",
      "Hubungi 112 jika dalam bahaya.",
      "Ikuti arahan petugas di posko pengungsian.",
    ],
    after: [
      "Bersihkan rumah dengan alas kaki dan sarung tangan.",
      "Periksa instalasi listrik sebelum menyalakannya kembali.",
      "Buang makanan yang terendam banjir.",
      "Catat kerusakan dan laporkan ke kelurahan bila perlu.",
    ],
    vulnerableGroups: vulnerableGroups(input),
    safePointIds,
    safePointReason:
      safePointIds.length > 0
        ? `Titik aman yang terdata di ${district.name} dan bisa dijangkau keluarga.`
        : `Belum ada titik aman terdata di ${district.name}; konfirmasi ke kelurahan.`,
  };
}
