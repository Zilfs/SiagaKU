"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  DoorOpen,
  Home,
  LoaderCircle,
  Minus,
  Plus,
  X,
} from "lucide-react";
import type {
  DisabilityType,
  HousingType,
  PlanDistrict,
  PlanRequest,
  RiverDistance,
  Vehicle,
} from "@/features/plan/ui-types";
import { initialDistrictId, wizardError } from "../wizard-validation";

const STEPS = [
  { title: "Wilayah & hunian", note: "Tempat tinggal dan jenis rumah" },
  { title: "Anggota keluarga", note: "Siapa yang tinggal bersama" },
  { title: "Kondisi rumah", note: "Kendaraan, sungai, riwayat banjir" },
];

const HOUSING: { value: HousingType; label: string; note: string; Icon: typeof Home }[] = [
  { value: "single_story", label: "Rumah satu lantai", note: "Semua ruang di lantai dasar", Icon: Home },
  { value: "multi_story", label: "Rumah bertingkat", note: "Ada lantai atas untuk mengungsi", Icon: Building2 },
  { value: "rented_room", label: "Kamar sewa", note: "Satu kamar, berbagi bangunan", Icon: DoorOpen },
  { value: "apartment", label: "Apartemen", note: "Gedung bertingkat dengan lift", Icon: Building2 },
];

const DISABILITIES: { value: DisabilityType; label: string }[] = [
  { value: "wheelchair_user", label: "Pengguna kursi roda" },
  { value: "blind", label: "Disabilitas penglihatan" },
  { value: "deaf", label: "Disabilitas pendengaran" },
  { value: "intellectual", label: "Disabilitas intelektual" },
  { value: "other", label: "Lainnya" },
];

const VEHICLES: { value: Vehicle; label: string }[] = [
  { value: "none", label: "Tidak ada" },
  { value: "motorcycle", label: "Motor" },
  { value: "car", label: "Mobil" },
  { value: "both", label: "Motor & mobil" },
];

const RIVERS: { value: RiverDistance; label: string; note: string }[] = [
  { value: "close", label: "Dekat", note: "Kurang dari 100 m" },
  { value: "medium", label: "Sedang", note: "100–500 m" },
  { value: "far", label: "Jauh", note: "Lebih dari 500 m" },
  { value: "unknown", label: "Tidak tahu", note: "" },
];

function Stepper({
  id,
  label,
  note,
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  id: string;
  label: string;
  note?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="sk-stepper" role="group" aria-labelledby={`${id}-label`}>
      <div className="sk-stepper__text">
        <span id={`${id}-label`} className="sk-stepper__label">
          {label}
        </span>
        {note ? <span className="sk-stepper__note">{note}</span> : null}
      </div>
      <div className="sk-stepper__controls">
        <button
          type="button"
          className="sk-stepper__btn"
          aria-label={`Kurangi ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span className="sk-stepper__value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="sk-stepper__btn"
          aria-label={`Tambah ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PlanWizard({
  districts,
  initialSlug,
}: {
  districts: PlanDistrict[];
  initialSlug?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [districtId, setDistrictId] = useState<number | "">(() =>
    initialDistrictId(districts, initialSlug),
  );
  const [housingType, setHousingType] = useState<HousingType>("single_story");
  const [floor, setFloor] = useState(0);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [elderly, setElderly] = useState(0);
  const [pregnant, setPregnant] = useState(0);
  const [routineMedicine, setRoutineMedicine] = useState(0);
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilities, setDisabilities] = useState<DisabilityType[]>([]);
  const [petInput, setPetInput] = useState("");
  const [petError, setPetError] = useState("");
  const [pets, setPets] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle>("none");
  const [riverDistance, setRiverDistance] = useState<RiverDistance>("unknown");
  const [floodedBefore, setFloodedBefore] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = adults + children + infants + elderly + pregnant;
  const selectedDistrict = districts.find((district) => district.id === districtId);
  const validation = {
    districtId,
    total,
    hasDisability,
    disabilityCount: disabilities.length,
  };
  const totalValid = total >= 1 && total <= 15;

  const toggleDisability = (type: DisabilityType) => {
    setDisabilities((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const addPet = () => {
    const pet = petInput.trim();
    if (!pet) return;
    if (pets.some((item) => item.toLowerCase() === pet.toLowerCase())) {
      setPetError("Hewan ini sudah ada di daftar.");
      return;
    }
    if (pets.length >= 10) {
      setPetError("Maksimal 10 hewan peliharaan.");
      return;
    }
    setPets((current) => [...current, pet]);
    setPetInput("");
    setPetError("");
  };

  const next = () => {
    const problem = wizardError(step, validation);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((current) => Math.min(2, current + 1));
  };

  const back = () => {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const problem =
      wizardError(0, validation) ?? wizardError(1, validation);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSubmitting(true);

    const payload: PlanRequest = {
      district_id: Number(districtId),
      housing: { type: housingType, floor },
      members: {
        adults,
        children,
        infants,
        elderly,
        pregnant,
        disabilities: disabilities.map((type) => ({ type })),
        routineMedicine,
        pets,
      },
      conditions: { vehicle, riverDistance, floodedBefore },
    };

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | { url?: string; slug?: string; error?: { code?: string } }
        | null;

      if (response.status === 201 && (result?.url || result?.slug)) {
        router.push(result.url ?? `/rencana/${result.slug}`);
        return;
      }
      if (response.status === 429) {
        setError(
          "Kamu sudah membuat beberapa rencana. Coba lagi dalam beberapa menit.",
        );
      } else {
        setError("Rencana belum bisa dibuat. Coba lagi sebentar lagi.");
      }
    } catch {
      setError("Jaringan sedang bermasalah. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (districts.length === 0) {
    return (
      <div className="sk-wizard sk-wizard--empty">
        <p className="sk-list__empty">
          Data kecamatan belum tersedia. Coba muat ulang halaman ini beberapa
          saat lagi.
        </p>
      </div>
    );
  }

  return (
    <section className="sk-wizard" aria-labelledby="wizard-h">
      <h2 id="wizard-h" className="sr-only">
        Buat rencana siaga
      </h2>

      <ol className="sk-wizard__steps" aria-label="Langkah rencana siaga">
        {STEPS.map((item, index) => (
          <li
            key={item.title}
            className={
              index === step
                ? "sk-wizard__step is-current"
                : index < step
                  ? "sk-wizard__step is-done"
                  : "sk-wizard__step"
            }
            aria-current={index === step ? "step" : undefined}
          >
            <span className="sk-wizard__num">
              {index < step ? <Check size={14} aria-hidden="true" /> : index + 1}
            </span>
            <span>
              <b>{item.title}</b>
              <small>{item.note}</small>
            </span>
          </li>
        ))}
      </ol>

      <form className="sk-wizard__panel" onSubmit={submit} noValidate>
        {step === 0 ? (
          <fieldset className="sk-fieldset">
            <legend>Wilayah &amp; hunian</legend>
            <div className="sk-field">
              <label htmlFor="rencana-kecamatan">Kecamatan</label>
              <select
                id="rencana-kecamatan"
                value={districtId}
                onChange={(event) => setDistrictId(Number(event.target.value))}
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name} · {district.city}
                  </option>
                ))}
              </select>
              {selectedDistrict ? (
                <p className="sk-field__hint">
                  Rencana memakai data risiko {selectedDistrict.name} hari ini.
                </p>
              ) : null}
            </div>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Jenis hunian</legend>
              <div className="sk-choice-grid">
                {HOUSING.map(({ value, label, note, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      housingType === value
                        ? "sk-choice is-on"
                        : "sk-choice"
                    }
                    aria-pressed={housingType === value}
                    onClick={() => setHousingType(value)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <b>{label}</b>
                    <span>{note}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="sk-field sk-field--narrow">
              <label htmlFor="rencana-lantai">Lantai rumah</label>
              <input
                id="rencana-lantai"
                type="number"
                min={0}
                max={60}
                value={floor}
                onChange={(event) =>
                  setFloor(
                    Math.min(60, Math.max(0, Number(event.target.value) || 0)),
                  )
                }
                inputMode="numeric"
              />
              <p className="sk-field__hint">
                Isi 0 kalau rumah tanpa lantai atas.
              </p>
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset className="sk-fieldset">
            <legend>Anggota keluarga</legend>
            <div className="sk-step-list">
              <Stepper id="dewasa" label="Dewasa" value={adults} onChange={setAdults} />
              <Stepper id="anak" label="Anak-anak" value={children} onChange={setChildren} />
              <Stepper id="bayi" label="Bayi" value={infants} onChange={setInfants} />
              <Stepper id="lansia" label="Lansia" value={elderly} onChange={setElderly} />
              <Stepper id="hamil" label="Ibu hamil" value={pregnant} onChange={setPregnant} />
              <Stepper
                id="obat"
                label="Obat rutin"
                note="Jumlah anggota yang minum obat rutin"
                value={routineMedicine}
                onChange={setRoutineMedicine}
              />
            </div>

            <p className={totalValid ? "sk-field__hint" : "sk-field__error"}>
              Total {total} anggota{total > 15 ? " · maksimal 15" : ""}.
            </p>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Disabilitas</legend>
              <label className="sk-check">
                <input
                  type="checkbox"
                  checked={hasDisability}
                  onChange={(event) => {
                    setHasDisability(event.target.checked);
                    if (!event.target.checked) setDisabilities([]);
                  }}
                />
                Ada anggota keluarga dengan disabilitas
              </label>
              {hasDisability ? (
                <div className="sk-choice-grid sk-choice-grid--chips">
                  {DISABILITIES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={
                        disabilities.includes(item.value)
                          ? "sk-chip is-on"
                          : "sk-chip"
                      }
                      aria-pressed={disabilities.includes(item.value)}
                      onClick={() => toggleDisability(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {hasDisability && disabilities.length === 0 ? (
                <p className="sk-field__error">
                  Pilih minimal satu jenis disabilitas.
                </p>
              ) : null}
            </fieldset>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Hewan peliharaan</legend>
              <div className="sk-inline-add">
                <label className="sr-only" htmlFor="rencana-hewan">
                  Nama hewan peliharaan
                </label>
                <input
                  id="rencana-hewan"
                  type="text"
                  value={petInput}
                  maxLength={30}
                  placeholder="Contoh: kucing"
                  onChange={(event) => {
                    setPetInput(event.target.value);
                    setPetError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addPet();
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addPet}>
                  Tambah
                </button>
              </div>
              {petError ? (
                <p className="sk-field__error" role="alert">
                  {petError}
                </p>
              ) : null}
              {pets.length > 0 ? (
                <ul className="sk-pet-list" aria-label="Hewan peliharaan">
                  {pets.map((pet) => (
                    <li key={pet}>
                      {pet}
                      <button
                        type="button"
                        aria-label={`Hapus ${pet}`}
                        onClick={() =>
                          setPets((current) =>
                            current.filter((item) => item !== pet),
                          )
                        }
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </fieldset>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="sk-fieldset">
            <legend>Kondisi rumah</legend>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Kendaraan untuk mengungsi</legend>
              <div className="sk-choice-grid sk-choice-grid--chips">
                {VEHICLES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={
                      vehicle === item.value ? "sk-chip is-on" : "sk-chip"
                    }
                    aria-pressed={vehicle === item.value}
                    onClick={() => setVehicle(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Jarak ke sungai atau kali</legend>
              <div className="sk-choice-grid">
                {RIVERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={
                      riverDistance === item.value
                        ? "sk-choice is-on"
                        : "sk-choice"
                    }
                    aria-pressed={riverDistance === item.value}
                    onClick={() => setRiverDistance(item.value)}
                  >
                    <b>{item.label}</b>
                    {item.note ? <span>{item.note}</span> : null}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="sk-fieldset sk-fieldset--nested">
              <legend>Riwayat banjir di rumah</legend>
              <div className="sk-choice-grid sk-choice-grid--chips">
                <button
                  type="button"
                  className={floodedBefore ? "sk-chip is-on" : "sk-chip"}
                  aria-pressed={floodedBefore}
                  onClick={() => setFloodedBefore(true)}
                >
                  Pernah terdampak
                </button>
                <button
                  type="button"
                  className={!floodedBefore ? "sk-chip is-on" : "sk-chip"}
                  aria-pressed={!floodedBefore}
                  onClick={() => setFloodedBefore(false)}
                >
                  Belum pernah
                </button>
              </div>
            </fieldset>

            <div className="sk-wizard__summary">
              <h3>Ringkasan</h3>
              <ul>
                <li>
                  <span>Kecamatan</span>
                  <b>{selectedDistrict?.name ?? "—"}</b>
                </li>
                <li>
                  <span>Hunian</span>
                  <b>
                    {HOUSING.find((item) => item.value === housingType)?.label} ·
                    lantai {floor}
                  </b>
                </li>
                <li>
                  <span>Anggota</span>
                  <b>{total} orang</b>
                </li>
                <li>
                  <span>Disabilitas</span>
                  <b>
                    {disabilities.length
                      ? disabilities
                          .map(
                            (type) =>
                              DISABILITIES.find((item) => item.value === type)
                                ?.label ?? type,
                          )
                          .join(", ")
                      : "Tidak ada"}
                  </b>
                </li>
                <li>
                  <span>Hewan</span>
                  <b>{pets.length ? pets.join(", ") : "Tidak ada"}</b>
                </li>
              </ul>
            </div>
          </fieldset>
        ) : null}

        {error ? (
          <p className="sk-field__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sk-wizard__actions">
          {step > 0 ? (
            <button type="button" className="btn" onClick={back} disabled={submitting}>
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali
            </button>
          ) : null}
          {step < 2 ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={next}
            >
              Lanjut
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="sk-spin" aria-hidden="true" />
                  Menyusun rencana…
                </>
              ) : (
                "Buat rencana siaga"
              )}
            </button>
          )}
        </div>
        <p className="sk-wizard__note">
          Tanpa akun dan tanpa data pribadi. Rencana disimpan lewat tautan yang
          bisa dibagikan.
        </p>
      </form>
    </section>
  );
}
