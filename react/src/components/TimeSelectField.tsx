type TimeSelectFieldProps = {
  id: string;
  value: string | null;
  onChange: (next: string | null) => void;
};

function splitHHMM(value: string | null): { hour: string; minute: string } {
  if (!value) return { hour: '', minute: '' };
  const [hhRaw, mmRaw] = value.split(':');
  const hh = Number.parseInt(hhRaw, 10);
  const mm = Number.parseInt(mmRaw, 10);
  const hour = Number.isInteger(hh) && hh >= 0 && hh <= 23 ? String(hh).padStart(2, '0') : '';
  const minute = Number.isInteger(mm) && mm >= 0 && mm <= 59 ? String(mm).padStart(2, '0') : '';
  return { hour, minute };
}

export function TimeSelectField({ id, value, onChange }: TimeSelectFieldProps) {
  const { hour, minute } = splitHHMM(value);

  const handleHourChange = (nextHour: string) => {
    if (!nextHour) {
      onChange(null);
      return;
    }
    onChange(`${nextHour}:${minute || '00'}`);
  };

  const handleMinuteChange = (nextMinute: string) => {
    if (!nextMinute) {
      onChange(null);
      return;
    }
    onChange(`${hour || '00'}:${nextMinute}`);
  };

  return (
    <div className="settings-time-picker">
      <select id={`${id}Hour`} className="time-select time-select-hour" value={hour} onChange={(e) => handleHourChange(e.target.value)}>
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <span className="time-separator">:</span>
      <select id={`${id}Minute`} className="time-select time-select-minute" value={minute} onChange={(e) => handleMinuteChange(e.target.value)}>
        <option value="">--</option>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <button id={id} type="button" className="text-link settings-time-clear" onClick={() => onChange(null)}>
        クリア
      </button>
    </div>
  );
}
