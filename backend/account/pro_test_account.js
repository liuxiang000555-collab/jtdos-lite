const PRO_TEST_ACCOUNT = Object.freeze({
  email: "pro-test@jtdos.com",
  account_type: "Internal Pro Test Account",
  company_name: "JTDOS Internal Pro Test",
  environment: "staging / beta",
  plan: "pro",
  plan_status: "active",
  payment_status: "test_paid",
  payment_provider: "manual_test",
  license_source: "manual_test",
  license_status: "active",
  price_usd: 999,
  organization_role: "owner",
  purpose: "Daily real conversation validation for JTDOS Pro.",
  audit_action: "manual_pro_test_account_created",
  real_payment_processed: false,
  production_customer_account: false,
});

function isProTestQuery(searchParams = new URLSearchParams()) {
  const plan = String(searchParams.get("plan") || "").toLowerCase();
  const mode = String(searchParams.get("mode") || "").toLowerCase();
  const email = String(searchParams.get("email") || "").toLowerCase();

  return (
    plan === "pro" ||
    plan === "pro-test" ||
    mode === "pro-test" ||
    email === PRO_TEST_ACCOUNT.email
  );
}

function dashboardStateFromRequest(url) {
  const enabled = isProTestQuery(url.searchParams);

  if (!enabled) {
    return {
      success: true,
      account_mode: "lite",
      plan: "lite",
      plan_status: "active",
      pro_features_unlocked: false,
      message: "Lite demo mode. Pro features are locked until a valid Pro license is active.",
    };
  }

  return {
    success: true,
    account_mode: "manual_pro_test",
    test_account: true,
    email: PRO_TEST_ACCOUNT.email,
    account_type: PRO_TEST_ACCOUNT.account_type,
    company_name: PRO_TEST_ACCOUNT.company_name,
    environment: PRO_TEST_ACCOUNT.environment,
    plan: PRO_TEST_ACCOUNT.plan,
    plan_status: PRO_TEST_ACCOUNT.plan_status,
    payment_status: PRO_TEST_ACCOUNT.payment_status,
    payment_provider: PRO_TEST_ACCOUNT.payment_provider,
    license_source: PRO_TEST_ACCOUNT.license_source,
    license_status: PRO_TEST_ACCOUNT.license_status,
    organization_role: PRO_TEST_ACCOUNT.organization_role,
    pro_features_unlocked: true,
    real_payment_processed: false,
    production_customer_account: false,
    message: "Pro features unlocked in test mode.",
    safety_note: "No real payment was processed. This manual Pro account is only for internal daily validation.",
  };
}

function publicProTestAccountSummary() {
  return {
    success: true,
    account: PRO_TEST_ACCOUNT,
  };
}

module.exports = {
  PRO_TEST_ACCOUNT,
  isProTestQuery,
  dashboardStateFromRequest,
  publicProTestAccountSummary,
};
