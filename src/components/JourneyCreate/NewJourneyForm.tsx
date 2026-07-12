import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { createJourney } from "../../lib/journeyActions";
import { Button } from "../ui/Button";
import type { FamilyMember } from "../../types";

export function NewJourneyForm() {
  const navigate = useNavigate();
  const [departureCity, setDepartureCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: nanoid(), name: "", role: "parent" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addMember(role: FamilyMember["role"]) {
    setMembers((prev) => [...prev, { id: nanoid(), name: "", role }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const title =
      departureCity && destinationCity
        ? `${departureCity} to ${destinationCity}`
        : "Our Move";
    const journey = await createJourney({
      type: "relocation",
      title,
      departureCity,
      destinationCity,
      departureDate,
      familyMembers: members.filter((m) => m.name.trim()),
    });
    navigate(`/journey/${journey.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Leaving from">
          <input
            required
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
            placeholder="Bengaluru"
            className="input"
          />
        </Field>
        <Field label="Heading to">
          <input
            required
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="Seattle"
            className="input"
          />
        </Field>
      </div>

      <Field label="Departure date">
        <input
          required
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          className="input"
        />
      </Field>

      <div>
        <p className="text-[11px] font-mono tracking-[0.15em] text-stamp uppercase mb-2">
          Who's travelling
        </p>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex gap-2">
              <input
                value={m.name}
                onChange={(e) => updateMember(m.id, { name: e.target.value })}
                placeholder={m.role === "child" ? "Child's name" : "Name"}
                className="input flex-1"
              />
              <select
                value={m.role}
                onChange={(e) => updateMember(m.id, { role: e.target.value as FamilyMember["role"] })}
                className="input w-28"
              >
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addMember("child")}
          className="mt-2 text-sm text-teal-dark font-medium"
        >
          + Add family member
        </button>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating…" : "Start this journey"}
      </Button>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(27,35,51,0.15);
          background: #FBF7EF;
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: #1B2333;
        }
        .input:focus { outline: none; border-color: #2D5F5A; }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono tracking-[0.15em] text-stamp uppercase mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
