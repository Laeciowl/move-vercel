import { motion } from "framer-motion";
import { GraduationCap, Heart } from "lucide-react";

export type UserType = "mentee" | "mentor" | null;

interface UserTypeSelectorProps {
  selectedType: UserType;
  onSelect: (type: UserType) => void;
}

const UserTypeSelector = ({ selectedType, onSelect }: UserTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        Como você quer fazer parte da Movê?
      </p>
      
      <div className="grid grid-cols-1 gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("mentee")}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${
            selectedType === "mentee"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50 bg-card"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              selectedType === "mentee" ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg mb-1">
                Quero ser mentorado
              </h3>
              <p className="text-sm text-muted-foreground">
                Busco orientação profissional e quero evoluir na minha carreira com apoio de mentores experientes.
              </p>
            </div>
            {selectedType === "mentee" && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("mentor")}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${
            selectedType === "mentor"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50 bg-card"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              selectedType === "mentor" ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
            }`}>
              <Heart className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg mb-1">
                Quero ser mentor voluntário
              </h3>
              <p className="text-sm text-muted-foreground">
                Tenho experiência profissional e quero compartilhar conhecimento para ajudar quem está começando.
              </p>
            </div>
            {selectedType === "mentor" && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default UserTypeSelector;
