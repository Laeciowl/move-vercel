import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/components/TagSelector";

interface MentorTagFilterProps {
  availableTags: TagItem[];
  selectedTagIds: string[];
  onFilterChange: (tagIds: string[]) => void;
  userInterestTagIds?: string[];
}

const MentorTagFilter = ({
  availableTags,
  selectedTagIds,
  onFilterChange,
  userInterestTagIds = [],
}: MentorTagFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return availableTags;
    const query = searchQuery.toLowerCase();
    return availableTags.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    );
  }, [availableTags, searchQuery]);

  // Show user's interests first, then others
  const sortedTags = useMemo(() => {
    const interests = filteredTags.filter((t) => userInterestTagIds.includes(t.id));
    const others = filteredTags.filter((t) => !userInterestTagIds.includes(t.id));
    return [...interests, ...others];
  }, [filteredTags, userInterestTagIds]);

  const visibleTags = isExpanded ? sortedTags : sortedTags.slice(0, 8);

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onFilterChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onFilterChange([...selectedTagIds, tagId]);
    }
  };

  const handleClearFilters = () => {
    onFilterChange([]);
    setSearchQuery("");
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Filtrar por área</h3>
        {selectedTagIds.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedTagIds.length} selecionado{selectedTagIds.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar áreas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          const isUserInterest = userInterestTagIds.includes(tag.id);

          return (
            <motion.button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border-2",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : isUserInterest
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-700"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {isUserInterest && !isSelected && (
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              )}
              {tag.name}
            </motion.button>
          );
        })}
      </div>

      {sortedTags.length > 8 && (
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
              Ver mais ({sortedTags.length - 8} áreas)
            </>
          )}
        </Button>
      )}

      {selectedTagIds.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
};

export default MentorTagFilter;
