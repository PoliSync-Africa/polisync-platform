"use client";

import { useMemo, useState } from "react";

const DEMO_USERS = [
  {
    id: "USR-1001",
    name: "Kwame Mensah",
    email: "kwame@example.com",
    role: "national_admin",
    organization: "NPP",
    status: "active",
    verification: "verified",
    lastSeen: "2 min ago",
  },
  {
    id: "USR-1002",
    name: "Ama Boateng",
    email: "ama@example.com",
    role: "regional_admin",
    organization: "NDC",
    status: "active",
    verification: "verified",
    lastSeen: "8 min ago",
  },
  {
    id:
