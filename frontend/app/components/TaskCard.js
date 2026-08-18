"use client";

export default function TaskCard({
  title,
  assignedTo,
  status
}){
  return(
    <div
      style={{
        background:"white",
        borderRadius:18,
        padding:20
      }}
    >
      <h3>{title}</h3>

      <p>Assigned: {assignedTo}</p>

      <span
        style={{
          background
