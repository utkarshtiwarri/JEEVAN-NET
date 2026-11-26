import React from "react";

export function RecordItem({ label, value }) {
  return (
    <div className="record-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
