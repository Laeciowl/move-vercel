import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "./Signup";

// Mock react-router navigate so we can spy on the redirect target
const navigateSpy = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

// Mock the supabase client and edge function invocations
const signUpMock = vi.fn();
const invokeMock = vi.fn().mockResolvedValue({ data: null, error: null });
const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

// Mock the auth context to a logged-out state
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

// Mock the toast library
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const renderSignup = (initialEntry = "/cadastro?tipo=mentorado") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Signup />
    </MemoryRouter>,
  );

describe("Signup (mentee) — simplified form", () => {
  beforeEach(() => {
    navigateSpy.mockClear();
    signUpMock.mockReset();
    invokeMock.mockClear();
    rpcMock.mockClear();
  });

  it("does not render the 'Idade' (age) field", () => {
    renderSignup();
    expect(screen.queryByText(/idade/i)).toBeNull();
  });

  it("does not render the 'Como você conheceu' (discovery source) field", () => {
    renderSignup();
    expect(screen.queryByText(/como você conheceu/i)).toBeNull();
    expect(screen.queryByText(/Quem te indicou/i)).toBeNull();
  });

  it("redirects to /inicio after a successful signup", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { id: "user-abc" } },
      error: null,
    });

    renderSignup();

    // Fill in only the fields that remain on the simplified form
    fireEvent.change(screen.getByPlaceholderText(/seu nome completo/i), {
      target: { value: "Maria Tester" },
    });
    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "maria@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Digite o e-mail novamente/i), {
      target: { value: "maria@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Mín\. 8 caracteres/i),
      { target: { value: "AbcDef1!ghi" } },
    );
    fireEvent.change(screen.getByPlaceholderText("(11) 99999-9999"), {
      target: { value: "(11) 99999-9999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Digite o telefone novamente/i), {
      target: { value: "(11) 99999-9999" },
    });

    // Pick professional status
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "estudante" } });

    // LGPD consent
    fireEvent.click(screen.getByLabelText(/dados sejam usados/i));

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalledTimes(1));

    // Backend payload must NOT include age, discovery source or referrer name
    const [signUpArgs] = signUpMock.mock.calls[0];
    expect(signUpArgs.options.data).not.toHaveProperty("age");
    expect(signUpArgs.options.data).not.toHaveProperty("mentee_discovery_source");
    expect(signUpArgs.options.data).not.toHaveProperty("mentee_referrer_name");

    // After success, navigate to /inicio
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith("/inicio"));
  });
});
