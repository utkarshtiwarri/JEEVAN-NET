import React, { useState, useEffect } from "react";

export function Field({ label, value, onChange }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
