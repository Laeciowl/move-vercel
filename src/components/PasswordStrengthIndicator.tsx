import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Letra minúscula", met: /[a-z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$%^&*)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount === 5 ? "Forte" : metCount >= 3 ? "Média" : "Fraca";
  const strengthColor =
    metCount === 5 ? "text-green-600" : metCount >= 3 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              metCount === 5
                ? "bg-green-500 w-full"
                : metCount >= 3
                ? "bg-yellow-500 w-3/5"
                : metCount >= 1
                ? "bg-red-500 w-1/5"
                : "w-0"
            }`}
          />
        </div>
        <span className={`text-xs font-medium ${strengthColor}`}>{strength}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-1 ${
              req.met ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <X className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{req.label}</span>
          </li>
        ))}
      </ul>
      {metCount === 5 && (
        <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
          <span>⚠️</span>
          <span>Evite senhas comuns como nomes de times, datas ou sequências conhecidas — elas podem ser rejeitadas por segurança.</span>
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
