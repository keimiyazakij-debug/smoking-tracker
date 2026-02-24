type TimeSelectRowProps = {
  value: string;
  onChange: (next: string) => void;
  onRemove: () => void;
};

function splitHHMM(value: string) {
  const [hhRaw, mmRaw] = value.split(':');
  const hh = Number.parseInt(hhRaw, 10);
  const mm = Number.parseInt(mmRaw, 10);
  const hour = Number.isInteger(hh) && hh >= 0 && hh <= 23 ? String(hh).padStart(2, '0') : '00';
  const minute = Number.isInteger(mm) && mm >= 0 && mm <= 59 ? String(mm).padStart(2, '0') : '00';
  return { hour, minute };
}

export function TimeSelectRow({ value, onChange, onRemove }: TimeSelectRowProps) {
  const { hour, minute } = splitHHMM(value);
  return (
    <div className="time-tag">
      <div className="time-select-wrap">
        <select
          className="time-select time-select-hour"
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        >
          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <span className="time-separator">:</span>
        <select
          className="time-select time-select-minute"
          value={minute}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        >
          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
