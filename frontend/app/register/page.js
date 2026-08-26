"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState("account");

  const [accountType, setAccountType] =
    useState("");

  const [organizationType, setOrganizationType] =
    useState("");

  const [existingAccount, setExistingAccount] =
    useState("");

  const [observerMode, setObserverMode] =
    useState("");

  const [party, setParty] =
    useState("");

  const [region, setRegion] =
    useState("");

  const [constituency, setConstituency] =
    useState("");

  const [electionMode, setElectionMode] =
    useState("");

  const [electionId, setElectionId] =
    useState("");

  const [observerName, setObserverName] =
    useState("");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "Ghanaian",
    identificationType: "",
    identificationNumber: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // HARD-CODED GHANA POLITICAL PARTIES
  // ==========================================================

  const politicalParties = [
  {
    value: "NPP",
    name: "NPP",
    logo: "/party-logos/npp.png",
  },
  {
    value: "NDC",
    name: "NDC",
    logo: "/party-logos/ndc.png",
  },
  {
    value: "CPP",
    name: "CPP",
    logo: "/party-logos/cpp.png",
  },
  {
    value: "LPG",
    name: "LPG",
    logo: "/party-logos/lpg.png",
  },
  {
    value: "GUM",
    name: "GUM",
    logo: "/party-logos/gum.png",
  },
  {
    value: "PNC",
    name: "PNC",
    logo: "/party-logos/pnc.png",
  },
  {
    value: "PPP",
    name: "PPP",
    logo: "/party-logos/ppp.png",
  },
  {
    value: "THE_BASE_MOVEMENT",
    name: "The Base Movement",
    logo: "/party-logos/the-base-movement.png",
  },
  {
    value: "THE_NEW_FORCE",
    name: "The New Force",
    logo: "/party-logos/the-new-force.png",
  },
  {
    value: "UP_MOVEMENT_FOR_CHANGE",
    name: "UP (Movement For Change)",
    logo: "/party-logos/up-movement-for-change.png",
  },
  {
    value: "GFP",
    name: "GFP",
    logo: "/party-logos/gfp.png",
  },
  {
    value: "INDEPENDENT",
    name: "Independent",
    logo: "/party-logos/independent.png",
  },
];

  // ==========================================================
  // REGIONS
  // ==========================================================

  const regions = [
    "Ahafo",
    "Ashanti",
    "Bono",
    "Bono East",
    "Central",
    "Eastern",
    "Greater Accra",
    "North East",
    "Northern",
    "Oti",
    "Savannah",
    "Upper East",
    "Upper West",
    "Volta",
    "Western",
    "Western North",
  ];

  // ==========================================================
  // CONSTITUENCIES
  // ==========================================================
  //
  // IMPORTANT:
  // The production system should eventually load these
  // dynamically from the PoliSync geographic database.
  //
  // We do NOT want the frontend permanently maintaining
  // thousands of constituencies.
  //
  // This temporary object only keeps the UI functional
  // until the geographic API is connected.
  // ==========================================================

  const constituenciesByRegion = {
    "Ahafo": [],
    "Ashanti": [],
    "Bono": [],
    "Bono East": [],
    "Central": [],
    "Eastern": [],
    "Greater Accra": [],
    "North East": [],
    "Northern": [],
    "Oti": [],
    "Savannah": [],
    "Upper East": [],
    "Upper West": [],
    "Volta": [],
    "Western": [],
    "Western North": [],
  };

  const constituencies =
    constituenciesByRegion[region] || [];

  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================================
  // RESET REGISTRATION
  // ==========================================================

  function resetRegistration() {
    setStep("account");

    setAccountType("");

    setOrganizationType("");

    setExistingAccount("");

    setObserverMode("");

    setParty("");

    setRegion("");

    setConstituency("");

    setElectionMode("");

    setElectionId("");

    setObserverName("");

    setError("");

    setSuccess("");
  }

  // ==========================================================
  // ACCOUNT TYPE
  // ==========================================================

  function chooseAccountType(type) {
    setError("");

    setAccountType(type);

    if (type === "personal") {
      setStep("personal");
      return;
    }

    if (type === "organization") {
      setStep("organization");
      return;
    }
  }

  // ==========================================================
  // ORGANIZATION TYPE
  // ==========================================================

  function chooseOrganizationType(type) {
    setError("");

    setOrganizationType(type);

    setParty("");

    setRegion("");

    setConstituency("");

    setElectionMode("");

    setElectionId("");

    setExistingAccount("");

    setObserverMode("");

    if (type === "political-party") {
      setStep("party");
      return;
    }

    if (type === "presidential-candidate") {
      setStep("presidential");
      return;
    }

    if (type === "parliamentary-candidate") {
      setStep("parliamentary");
      return;
    }

    if (type === "observer") {
      setStep("observer");
      return;
    }
  }

  // ==========================================================
  // PARTY SELECTION
  // ==========================================================

  function selectParty(value) {
    setParty(value);
    setError("");
  }

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  function validatePassword() {
    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );

      return false;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // PERSONAL FORM VALIDATION
  // ==========================================================

  function validatePersonalForm() {
    setError("");

    const requiredFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "nationality",
      "identificationType",
      "identificationNumber",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ];

    for (const field of requiredFields) {
      if (!String(form[field] || "").trim()) {
        setError(
          "Please complete all required fields."
        );

        return false;
      }
    }

    if (!/^\+233\d{9}$/.test(
      form.phone.trim()
    )) {
      setError(
        "Phone number must be in Ghana format, for example +233XXXXXXXXX."
      );

      return false;
    }

    if (!validatePassword()) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // PERSONAL ACCOUNT
  // ==========================================================

  async function submitPersonalAccount() {
    if (!validatePersonalForm()) {
      return;
    }

    await submitRegistration({
      registrationType:
        "personal",
    });
  }

  // ==========================================================
  // POLITICAL PARTY VALIDATION
  // ==========================================================

  function validateParty() {
    if (!party) {
      setError(
        "Please select a political party."
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // PRESIDENTIAL CANDIDATE
  // ==========================================================

  function continuePresidentialCandidate() {
    setError("");

    if (!existingAccount) {
      setError(
        "Please select whether you already have a PoliSync Africa personal account."
      );

      return;
    }

    if (!validateParty()) {
      return;
    }

    if (existingAccount === "yes") {
      setStep("presidential-election");
      return;
    }

    setStep("presidential-personal");
  }

  // ==========================================================
  // PARLIAMENTARY CANDIDATE
  // ==========================================================

  function continueParliamentaryCandidate() {
    setError("");

    if (!existingAccount) {
      setError(
        "Please select whether you already have a PoliSync Africa personal account."
      );

      return;
    }

    if (!validateParty()) {
      return;
    }

    if (!region) {
      setError(
        "Please select a region."
      );

      return;
    }

    if (!constituency) {
      setError(
        "Please select a constituency."
      );

      return;
    }

    if (existingAccount === "yes") {
      setStep("parliamentary-election");
      return;
    }

    setStep("parliamentary-personal");
  }

  // ==========================================================
  // OBSERVER
  // ==========================================================

  function continueObserver() {
    setError("");

    if (!observerMode) {
      setError(
        "Please choose whether to join an existing group or create your own observer group."
      );

      return;
    }

    if (
      observerMode ===
      "create"
    ) {
      if (!observerName.trim()) {
        setError(
          "Please enter the observer organization name."
        );

        return;
      }

      setStep("observer-organization");
      return;
    }

    setStep("observer-join");
  }

  // ==========================================================
  // ELECTION SELECTION
  // ==========================================================

  function continueElection(
    nextStep
  ) {
    setError("");

    if (!electionMode) {
      setError(
        "Please choose how you want to participate in the election."
      );

      return;
    }

    if (
      electionMode === "join" &&
      !electionId
    ) {
      setError(
        "Please select an existing election or byelection."
      );

      return;
    }

    setStep(nextStep);
  }

  // ==========================================================
  // GENERIC REGISTRATION REQUEST
  // ==========================================================

  async function submitRegistration(
    additionalData = {}
  ) {
    setLoading(true);

    setError("");

    setSuccess("");

    try {
      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL ||
        ""
      ).replace(/\/+$/, "");

      if (!API_URL) {
        throw new Error(
          "Production API URL is not configured."
        );
      }

      const payload = {
        firstName:
          form.firstName.trim(),

        middleName:
          form.middleName.trim(),

        lastName:
          form.lastName.trim(),

        dateOfBirth:
          form.dateOfBirth,

        nationality:
          form.nationality.trim(),

        identificationType:
          form.identificationType,

        identificationNumber:
          form.identificationNumber.trim(),

        email:
          form.email.trim().toLowerCase(),

        phone:
          form.phone.trim(),

        password:
          form.password,

        ...additionalData,
      };

      const response =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data =
          await response.json();
      } else {
        const text =
          await response.text();

        data = {
          message:
            text ||
            "Registration failed.",
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Registration failed."
        );
      }

      setSuccess(
        data?.message ||
          "Account created successfully."
      );

      setTimeout(() => {
        window.location.href =
          "/login";
      }, 1200);
    } catch (registrationError) {
      console.error(
        "PoliSync registration error:",
        registrationError
      );

      setError(
        registrationError?.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PERSONAL INFORMATION FORM
  // ==========================================================

  function renderPersonalFields(
    submitLabel,
    submitHandler
  ) {
    return (
      <>
        <input
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) =>
            update(
              "firstName",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="given-name"
        />

        <input
          placeholder="Middle Name (Optional)"
          value={form.middleName}
          onChange={(e) =>
            update(
              "middleName",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="additional-name"
        />

        <input
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) =>
            update(
              "lastName",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="family-name"
        />

        <label style={labelStyle}>
          Date of Birth
        </label>

        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) =>
            update(
              "dateOfBirth",
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          placeholder="Nationality"
          value={form.nationality}
          onChange={(e) =>
            update(
              "nationality",
              e.target.value
            )
          }
          style={inputStyle}
        />

        <select
          value={
            form.identificationType
          }
          onChange={(e) =>
            update(
              "identificationType",
              e.target.value
            )
          }
          style={selectStyle}
        >
          <option value="">
            Select Identification Type
          </option>

          <option value="ghana_card">
            Ghana Card
          </option>

          <option value="voter_id">
            Voter ID
          </option>

          <option value="passport">
            Passport
          </option>
        </select>

        <input
          placeholder="Identification Number"
          value={
            form.identificationNumber
          }
          onChange={(e) =>
            update(
              "identificationNumber",
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            update(
              "email",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="email"
        />

        <input
          type="tel"
          placeholder="+233XXXXXXXXX"
          value={form.phone}
          onChange={(e) =>
            update(
              "phone",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="tel"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            update(
              "password",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={
            form.confirmPassword
          }
          onChange={(e) =>
            update(
              "confirmPassword",
              e.target.value
            )
          }
          style={inputStyle}
          autoComplete="new-password"
        />

        <button
          type="button"
          onClick={submitHandler}
          disabled={loading}
          style={primaryButtonStyle}
        >
          {loading
            ? "Creating Account..."
            : submitLabel}
        </button>
      </>
    );
  }

  // ==========================================================
  // SELECTED PARTY DISPLAY
  // ==========================================================

  function renderSelectedParty() {
    const selectedParty =
      politicalParties.find(
        (item) =>
          item.value === party
      );

    if (!selectedParty) {
      return null;
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px",
          borderRadius: "18px",
          border:
            "1px solid #D8D8D8",
          background: "#FAFAFA",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={selectedParty.logo}
            alt={
              selectedParty.name
            }
            width={52}
            height={52}
            style={{
              objectFit:
                "contain",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontWeight: "800",
              color: "#065F2B",
            }}
          >
            {selectedParty.name}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#777",
            }}
          >
            Selected political party
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <main
      style={pageStyle}
    >
      <div
        style={cardStyle}
      >
        {/* ==================================================
            LOGO
        ================================================== */}

        <div
          style={logoWrapperStyle}
        >
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={280}
            height={180}
            priority
            style={{
              width: "280px",
              height: "auto",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* ==================================================
            ACCOUNT TYPE
        ================================================== */}

        {step === "account" && (
          <>
            <h1 style={titleStyle}>
              Create Account
            </h1>

            <p style={subtitleStyle}>
              Select Type of Account
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  chooseAccountType(
                    "personal"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  Personal Account
                </strong>

                <span>
                  For individual citizens,
                  volunteers, researchers,
                  journalists and campaign
                  workers.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  chooseAccountType(
                    "organization"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  Organizational Account
                </strong>

                <span>
                  For political parties,
                  candidates, observers and
                  other approved organizations.
                </span>
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            ORGANIZATIONAL TYPE
        ================================================== */}

        {step === "organization" && (
          <>
            <BackButton
              onClick={() =>
                setStep("account")
              }
            />

            <h1 style={titleStyle}>
              Organizational Account
            </h1>

            <p style={subtitleStyle}>
              Select Organizational Type
            </p>

            <div
              style={choiceListStyle}
            >
              <button
                type="button"
                onClick={() =>
                  chooseOrganizationType(
                    "political-party"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  1. Political Party
                </strong>

                <span>
                  Register or manage an
                  approved political party.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  chooseOrganizationType(
                    "presidential-candidate"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  2. Presidential Candidate
                </strong>

                <span>
                  Presidential candidates
                  represent the nation.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  chooseOrganizationType(
                    "parliamentary-candidate"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  3. Parliamentary Candidate
                </strong>

                <span>
                  Represent a constituency
                  within a region.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  chooseOrganizationType(
                    "observer"
                  )
                }
                style={choiceButtonStyle}
              >
                <strong>
                  4. Observer
                </strong>

                <span>
                  Join or create an observer
                  organization.
                </span>
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            PERSONAL ACCOUNT
        ================================================== */}

        {step === "personal" && (
          <>
            <BackButton
              onClick={() =>
                setStep("account")
              }
            />

            <h1 style={titleStyle}>
              Personal Account
            </h1>

            <p style={subtitleStyle}>
              Enter your required personal
              information.
            </p>

            <div
              style={formContainerStyle}
            >
              {renderPersonalFields(
                "Create Personal Account",
                submitPersonalAccount
              )}
            </div>
          </>
        )}

        {/* ==================================================
            POLITICAL PARTY
        ================================================== */}

        {step === "party" && (
          <>
            <BackButton
              onClick={() =>
                setStep("organization")
              }
            />

            <h1 style={titleStyle}>
              Political Party
            </h1>

            <p style={subtitleStyle}>
              Select your political party.
            </p>

            <div
              style={formContainerStyle}
            >
              <select
                value={party}
                onChange={(e) =>
                  selectParty(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select Political Party
                </option>

                {politicalParties.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>

              {renderSelectedParty()}

              {party && (
                <button
                  type="button"
                  onClick={() =>
                    setStep(
                      "party-organization"
                    )
                  }
                  style={
                    primaryButtonStyle
                  }
                >
                  Continue
                </button>
              )}
            </div>
          </>
        )}

        {/* ==================================================
            PARTY ORGANIZATION
        ================================================== */}

        {step ===
          "party-organization" && (
          <>
            <BackButton
              onClick={() =>
                setStep("party")
              }
            />

            <h1 style={titleStyle}>
              Political Party
            </h1>

            <p style={subtitleStyle}>
              Organization registration
              requirements will be completed
              here.
            </p>

            {renderSelectedParty()}

            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                borderRadius: "18px",
                background: "#FFF9E8",
                border:
                  "1px solid #E5D18A",
                color: "#6A5510",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              Political party registration
              is subject to PoliSync Africa
              verification and approval.
            </div>

            <button
              type="button"
              disabled
              style={{
                ...primaryButtonStyle,
                marginTop: "18px",
                opacity: 0.55,
              }}
            >
              Continue to Party Verification
            </button>
          </>
        )}

        {/* ==================================================
            PRESIDENTIAL CANDIDATE
        ================================================== */}

        {step === "presidential" && (
          <>
            <BackButton
              onClick={() =>
                setStep("organization")
              }
            />

            <h1 style={titleStyle}>
              Presidential Candidate
            </h1>

            <p style={subtitleStyle}>
              Presidential candidates
              represent the nation.
            </p>

            <div
              style={formContainerStyle}
            >
              <label style={labelStyle}>
                Do you already have a
                PoliSync Africa personal
                account?
              </label>

              <select
                value={existingAccount}
                onChange={(e) =>
                  setExistingAccount(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select
                </option>

                <option value="yes">
                  Yes, I have an account
                </option>

                <option value="no">
                  No, create my account
                </option>
              </select>

              <label style={labelStyle}>
                Political Party
              </label>

              <select
                value={party}
                onChange={(e) =>
                  selectParty(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select Political Party
                </option>

                {politicalParties.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>

              {renderSelectedParty()}

              <button
                type="button"
                onClick={
                  continuePresidentialCandidate
                }
                style={
                  primaryButtonStyle
                }
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            PRESIDENTIAL PERSONAL DATA
        ================================================== */}

        {step ===
          "presidential-personal" && (
          <>
            <BackButton
              onClick={() =>
                setStep("presidential")
              }
            />

            <h1 style={titleStyle}>
              Personal Information
            </h1>

            <p style={subtitleStyle}>
              Create your PoliSync Africa
              personal account first.
            </p>

            <div
              style={formContainerStyle}
            >
              {renderPersonalFields(
                "Continue",
                () =>
                  setStep(
                    "presidential-election"
                  )
              )}
            </div>
          </>
        )}

        {/* ==================================================
            PRESIDENTIAL ELECTION
        ================================================== */}

        {step ===
          "presidential-election" && (
          <>
            <BackButton
              onClick={() =>
                setStep(
                  existingAccount ===
                    "yes"
                    ? "presidential"
                    : "presidential-personal"
                )
              }
            />

            <h1 style={titleStyle}>
              Election Participation
            </h1>

            <p style={subtitleStyle}>
              Select how you want to
              participate in an election.
            </p>

            <div
              style={formContainerStyle}
            >
              {renderSelectedParty()}

              <select
                value={electionMode}
                onChange={(e) =>
                  setElectionMode(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select Option
                </option>

                <option value="create">
                  Create an Election
                </option>

                <option value="select">
                  Select Existing Election
                </option>

                <option value="join">
                  Join Existing Election
                </option>
              </select>

              {electionMode ===
                "join" && (
                <select
                  value={electionId}
                  onChange={(e) =>
                    setElectionId(
                      e.target.value
                    )
                  }
                  style={selectStyle}
                >
                  <option value="">
                    Select Election
                  </option>

                  <option value="existing-election">
                    Existing Election
                  </option>

                  <option value="existing-byelection">
                    Existing Byelection
                  </option>
                </select>
              )}

              <button
                type="button"
                onClick={() =>
                  continueElection(
                    "presidential-review"
                  )
                }
                style={
                  primaryButtonStyle
                }
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            PRESIDENTIAL REVIEW
        ================================================== */}

        {step ===
          "presidential-review" && (
          <>
            <BackButton
              onClick={() =>
                setStep(
                  "presidential-election"
                )
              }
            />

            <h1 style={titleStyle}>
              Presidential Candidate
            </h1>

            <p style={subtitleStyle}>
              Review your candidate
              registration.
            </p>

            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "#F8FAF8",
                border:
                  "1px solid #D8E6DA",
                lineHeight: "1.8",
                fontSize: "14px",
              }}
            >
              <strong>
                Representation:
              </strong>{" "}
              National
              <br />

              <strong>
                Political Party:
              </strong>{" "}
              {
                politicalParties.find(
                  (item) =>
                    item.value ===
                    party
                )?.name
              }
              <br />

              <strong>
                Election:
              </strong>{" "}
              {electionMode ===
              "create"
                ? "Create Election"
                : electionMode ===
                  "select"
                ? "Select Existing Election"
                : "Join Existing Election"}
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess(
                  "Candidate registration is ready for PoliSync Africa verification."
                )
              }
              style={
                primaryButtonStyle
              }
            >
              Submit for Verification
            </button>
          </>
        )}

        {/* ==================================================
            PARLIAMENTARY CANDIDATE
        ================================================== */}

        {step ===
          "parliamentary" && (
          <>
            <BackButton
              onClick={() =>
                setStep("organization")
              }
            />

            <h1 style={titleStyle}>
              Parliamentary Candidate
            </h1>

            <p style={subtitleStyle}>
              Parliamentary candidates
              represent a constituency within
              a region.
            </p>

            <div
              style={formContainerStyle}
            >
              <label style={labelStyle}>
                Existing PoliSync Account?
              </label>

              <select
                value={existingAccount}
                onChange={(e) =>
                  setExistingAccount(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select
                </option>

                <option value="yes">
                  Yes, I have an account
                </option>

                <option value="no">
                  No, create my account
                </option>
              </select>

              <label style={labelStyle}>
                Political Party
              </label>

              <select
                value={party}
                onChange={(e) =>
                  selectParty(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select Political Party
                </option>

                {politicalParties.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>

              {renderSelectedParty()}

              <label style={labelStyle}>
                Region
              </label>

              <select
                value={region}
                onChange={(e) => {
                  setRegion(
                    e.target.value
                  );

                  setConstituency("");
                }}
                style={selectStyle}
              >
                <option value="">
                  Select Region
                </option>

                {regions.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

              <label style={labelStyle}>
                Constituency
              </label>

              <select
                value={constituency}
                onChange={(e) =>
                  setConstituency(
                    e.target.value
                  )
                }
                disabled={!region}
                style={{
                  ...selectStyle,
                  opacity:
                    region ? 1 : 0.6,
                }}
              >
                <option value="">
                  {region
                    ? "Select Constituency"
                    : "Select Region First"}
                </option>

                {constituencies.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={
                  continueParliamentaryCandidate
                }
                style={
                  primaryButtonStyle
                }
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            PARLIAMENTARY PERSONAL
        ================================================== */}

        {step ===
          "parliamentary-personal" && (
          <>
            <BackButton
              onClick={() =>
                setStep(
                  "parliamentary"
                )
              }
            />

            <h1 style={titleStyle}>
              Personal Information
            </h1>

            <p style={subtitleStyle}>
              Create your PoliSync Africa
              personal account first.
            </p>

            <div
              style={formContainerStyle}
            >
              {renderPersonalFields(
                "Continue",
                () =>
                  setStep(
                    "parliamentary-election"
                  )
              )}
            </div>
          </>
        )}

        {/* ==================================================
            PARLIAMENTARY ELECTION
        ================================================== */}

        {step ===
          "parliamentary-election" && (
          <>
            <BackButton
              onClick={() =>
                setStep(
                  existingAccount ===
                    "yes"
                    ? "parliamentary"
                    : "parliamentary-personal"
                )
              }
            />

            <h1 style={titleStyle}>
              Election / Byelection
            </h1>

            <p style={subtitleStyle}>
              Select how you want to
              participate.
            </p>

            <div
              style={formContainerStyle}
            >
              {renderSelectedParty()}

              <div
                style={{
                  padding: "14px",
                  borderRadius: "18px",
                  background:
                    "#F8FAF8",
                  fontSize: "14px",
                  lineHeight: "1.7",
                }}
              >
                <strong>
                  Region:
                </strong>{" "}
                {region}
                <br />

                <strong>
                  Constituency:
                </strong>{" "}
                {constituency}
              </div>

              <select
                value={electionMode}
                onChange={(e) =>
                  setElectionMode(
                    e.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="">
                  Select Option
                </option>

                <option value="create">
                  Create Election / Byelection
                </option>

                <option value="select">
                  Select Existing Election / Byelection
                </option>

                <option value="join">
                  Join Existing Election / Byelection
                </option>
              </select>

              {electionMode ===
                "join" && (
                <select
                  value={electionId}
                  onChange={(e) =>
                    setElectionId(
                      e.target.value
                    )
                  }
                  style={selectStyle}
                >
                  <option value="">
                    Select Election / Byelection
                  </option>

                  <option value="existing-election">
                    Existing Election
                  </option>

                  <option value="existing-byelection">
                    Existing Byelection
                  </option>
                </select>
              )}

              <button
                type="button"
                onClick={() =>
                  continueElection(
                    "parliamentary-review"
                  )
                }
                style={
                  primaryButtonStyle
                }
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            PARLIAMENTARY REVIEW
        ================================================== */}

        {step ===
          "parliamentary-review" && (
          <>
            <BackButton
              onClick={() =>
                setStep(
                  "parliamentary-election"
                )
              }
            />

            <h1 style={titleStyle}>
              Parliamentary Candidate
            </h1>

            <p style={subtitleStyle}>
              Review your candidate
              registration.
            </p>

            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "#F8FAF8",
                border:
                  "1px solid #D8E6DA",
                lineHeight: "1.8",
                fontSize: "14px",
              }}
            >
              <strong>
                Region:
              </strong>{" "}
              {region}
              <br />

              <strong>
                Constituency:
              </strong>{" "}
              {constituency}
              <br />

              <strong>
                Political Party:
              </strong>{" "}
              {
                politicalParties.find(
                  (item) =>
                    item.value ===
                    party
                )?.name
              }
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess(
                  "Candidate registration is ready for PoliSync Africa verification."
                )
              }
              style={
                primaryButtonStyle
              }
            >
              Submit for Verification
            </button>
          </>
        )}

        {/* ==================================================
            OBSERVER
        ================================================== */}

        {step === "observer" && (
          <>
            <BackButton
              onClick={() =>
                setStep("organization")
              }
            />

            <h1 style={titleStyle}>
              Observer
            </h1>

            <p style={subtitleStyle}>
              Choose how you want to
              participate as an observer.
            </p>

            <div
              style={formContainerStyle}
            >
              <button
                type="button"
                onClick={() =>
                  setObserverMode(
                    "join"
                  )
                }
                style={{
                  ...choiceButtonStyle,
                  border:
                    observerMode ===
                    "join"
                      ? "2px solid #065F2B"
                      : "1.5px solid #D8D8D8",
                }}
              >
                <strong>
                  Join Existing Group
                </strong>

                <span>
                  Join an approved observer
                  organization.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setObserverMode(
                    "create"
                  )
                }
                style={{
                  ...choiceButtonStyle,
                  border:
                    observerMode ===
                    "create"
                      ? "2px solid #065F2B"
                      : "1.5px solid #D8D8D8",
                }}
              >
                <strong>
                  Create My Own Observer Group
                </strong>

                <span>
                  Create a new observer
                  organization subject to
                  approval.
                </span>
              </button>

              {observerMode ===
                "create" && (
                <input
                  placeholder="Observer Organization Name"
                  value={
                    observerName
                  }
                  onChange={(e) =>
                    setObserverName(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              )}

              {observerMode ===
                "join" && (
                <select
                  style={selectStyle}
                  defaultValue=""
                >
                  <option value="">
                    Select Existing Observer Group
                  </option>

                  <option value="existing-observer">
                    Existing Observer Group
                  </option>
                </select>
              )}

              <button
                type="button"
                onClick={
                  continueObserver
                }
                style={
                  primaryButtonStyle
                }
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            OBSERVER ORGANIZATION
        ================================================== */}

        {step ===
          "observer-organization" && (
          <>
            <BackButton
              onClick={() =>
                setStep("observer")
              }
            />

            <h1 style={titleStyle}>
              Observer Organization
            </h1>

            <p style={subtitleStyle}>
              Complete the required
              organization information.
            </p>

            <div
              style={formContainerStyle}
            >
              <input
                placeholder="Observer Organization Name"
                value={
                  observerName
                }
                onChange={(e) =>
                  setObserverName(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background:
                    "#FFF9E8",
                  border:
                    "1px solid #E5D18A",
                  color:
                    "#6A5510",
                  fontSize: "14px",
                  lineHeight:
                    "1.5",
                }}
              >
                Observer organization
                registration is subject
                to PoliSync Africa
                verification and approval.
              </div>

              <button
                type="button"
                disabled
                style={{
                  ...primaryButtonStyle,
                  opacity: 0.55,
                }}
              >
                Continue to Verification
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            OBSERVER JOIN
        ================================================== */}

        {step ===
          "observer-join" && (
          <>
            <BackButton
              onClick={() =>
                setStep("observer")
              }
            />

            <h1 style={titleStyle}>
              Join Observer Group
            </h1>

            <p style={subtitleStyle}>
              Select an existing observer
              organization.
            </p>

            <div
              style={formContainerStyle}
            >
              <select
                style={selectStyle}
                defaultValue=""
              >
                <option value="">
                  Select Observer Group
                </option>

                <option value="existing-observer">
                  Existing Observer Group
                </option>
              </select>

              <button
                type="button"
                disabled
                style={{
                  ...primaryButtonStyle,
                  opacity: 0.55,
                }}
              >
                Request to Join
              </button>
            </div>
          </>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background:
                "#FFF3F3",
              border:
                "1px solid #F0CACA",
              color: "#A00000",
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div
            role="status"
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background:
                "#F0FAF3",
              border:
                "1px solid #B8DEC3",
              color: "#065F2B",
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            {success}
          </div>
        )}

        {/* ==================================================
            SIGN IN
        ================================================== */}

        <div
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#555",
            fontSize: "15px",
          }}
        >
          Already have an account?
          <br />

          <Link
            href="/login"
            style={{
              display:
                "inline-block",
              marginTop: "4px",
              color: "#C9A227",
              fontWeight: "800",
              textDecoration:
                "none",
            }}
          >
            Sign In
          </Link>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer
          style={{
            textAlign: "center",
            marginTop: "26px",
            paddingTop: "18px",
            borderTop:
              "1px solid #E8E8E8",
            color: "#777",
            fontSize: "12px",
            lineHeight: "1.7",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#065F2B",
            }}
          >
            PoliSync Africa
          </div>

          <div>
            Africa Best Political
            Intelligence Platform
          </div>

          <div>
            Powered by{" "}
            <strong>
              SyncTech Technologies
            </strong>
          </div>

          <div>
            All rights reserved
          </div>
        </footer>
      </div>
    </main>
  );
}

// ============================================================
// BACK BUTTON
// ============================================================

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background:
          "transparent",
        color: "#065F2B",
        fontWeight: "700",
        cursor: "pointer",
        padding: "0",
        marginBottom: "12px",
        fontSize: "14px",
        textAlign: "left",
      }}
    >
      ← Back
    </button>
  );
}

// ============================================================
// STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px 16px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "440px",
  background: "#FFFFFF",
  borderRadius: "30px",
  padding: "28px 26px 24px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,.08)",
  border:
    "1px solid rgba(0,0,0,.05)",
  boxSizing: "border-box",
};

const logoWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "8px",
};

const titleStyle = {
  textAlign: "center",
  color: "#065F2B",
  fontSize: "27px",
  lineHeight: "1.2",
  fontWeight: "800",
  margin: "4px 0 8px",
};

const subtitleStyle = {
  textAlign: "center",
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin:
    "0 0 24px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px 18px",
  borderRadius: "999px",
  border:
    "1.5px solid #D8D8D8",
  background: "#FFFFFF",
  fontSize: "16px",
  outline: "none",
};

const selectStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px 18px",
  borderRadius: "18px",
  border:
    "1.5px solid #D8D8D8",
  background: "#FFFFFF",
  fontSize: "16px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontWeight: "700",
  color: "#222",
  fontSize: "14px",
  marginBottom: "-8px",
};

const formContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const choiceListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const choiceButtonStyle = {
  width: "100%",
  padding: "18px",
  borderRadius: "20px",
  border:
    "1.5px solid #D8D8D8",
  background: "#FFFFFF",
  color: "#222",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  fontSize: "15px",
  lineHeight: "1.45",
};

const primaryButtonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "999px",
  border: "none",
  background:
    "linear-gradient(90deg,#0A8F3C,#065F2B)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow:
    "0 12px 30px rgba(6,95,43,.20)",
};
