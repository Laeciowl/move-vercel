import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Search, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TagItem {
  id: string;
  name: string;
  category: string;
  slug: string;
}

interface TagSelectorProps {
  availableTags: TagItem[];
  selectedTags: TagItem[];
  onTagsChange: (tags: TagItem[]) => void;
  maxTags?: number;
  minTags?: number;
  matchingTagIds?: string[];
  showSearch?: boolean;
  showCategoryFilter?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const categoryOrder = [
  "Carreira e Desenvolvimento",
  "Tecnologia",
  "Negócios",
  "Recursos Humanos",
  "Comunicação",
  "Análise de Dados",
  "Áreas Específicas",
  "Habilidades Transversais",
];

const TagSelector = ({
  availableTags,
  selectedTags,
  onTagsChange,
  maxTags,
  minTags = 0,
  matchingTagIds = [],
  showSearch = true,
  showCategoryFilter = true,
  title = "Áreas de Mentoria",
  subtitle,
  className,
}: TagSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(availableTags.map((t) => t.category))];
    return uniqueCategories.sort(
      (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );
  }, [availableTags]);

  const filteredTags = useMemo(() => {
    let tags = availableTags;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tags = tags.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      tags = tags.filter((t) => t.category === selectedCategory);
    }

    return tags;
  }, [availableTags, searchQuery, selectedCategory]);

  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, TagItem[]> = {};
    filteredTags.forEach((tag) => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    return grouped;
  }, [filteredTags]);

  const sortedCategories = useMemo(() => {
    return Object.keys(tagsByCategory).sort(
      (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );
  }, [tagsByCategory]);

  const visibleCategories = isExpanded
    ? sortedCategories
    : sortedCategories.slice(0, 3);

  const isSelected = (tagId: string) =>
    selectedTags.some((t) => t.id === tagId);

  const isMatching = (tagId: string) => matchingTagIds.includes(tagId);

  const isDisabled = (tagId: string) =>
    maxTags !== undefined &&
    selectedTags.length >= maxTags &&
    !isSelected(tagId);

  const handleToggleTag = (tag: TagItem) => {
    if (isSelected(tag.id)) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else if (!maxTags || selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>

      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar áreas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}
        {showCategoryFilter && (
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tags by Category */}
      <div className="space-y-4 bg-muted/30 rounded-xl p-4 border border-border/50">
        {visibleCategories.map((category) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {tagsByCategory[category].map((tag) => {
                const selected = isSelected(tag.id);
                const matching = isMatching(tag.id);
                const disabled = isDisabled(tag.id);

                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    onClick={() => !disabled && handleToggleTag(tag)}
                    disabled={disabled}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border-2",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : matching
                        ? "bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/30 dark:text-amber-200"
                        : "bg-background text-foreground border-border hover:border-primary/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {matching && !selected && (
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    )}
                    {tag.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {sortedCategories.length > 3 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-primary hover:bg-primary/10"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver todas as áreas ({sortedCategories.length - 3} mais)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Selecionadas
            </p>
            {maxTags && (
              <span className="text-xs text-muted-foreground">
                {selectedTags.length}/{maxTags}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {selectedTags.map((tag) => (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium gap-1.5 cursor-pointer hover:bg-primary/90"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    {tag.name}
                    <X className="w-3 h-3" />
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Validation message */}
      {minTags > 0 && selectedTags.length < minTags && (
        <p className="text-xs text-destructive">
          Selecione pelo menos {minTags} área{minTags > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default TagSelector;
