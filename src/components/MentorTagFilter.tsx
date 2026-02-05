import { useState, useMemo } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  // Group tags by category for the dropdown
  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, TagItem[]> = {};
    availableTags.forEach((tag) => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    return grouped;
  }, [availableTags]);

  const handleSelectTag = (tagId: string) => {
    if (tagId && !selectedTagIds.includes(tagId)) {
      onFilterChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onFilterChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleClearFilters = () => {
    onFilterChange([]);
  };

  const getTagById = (tagId: string) => availableTags.find((t) => t.id === tagId);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Filtrar por área</h3>
      </div>

      <Select onValueChange={handleSelectTag} value="">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma área..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border z-50 max-h-[300px]">
          {Object.entries(tagsByCategory).map(([category, tags]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </div>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                const isUserInterest = userInterestTagIds.includes(tag.id);
                return (
                  <SelectItem
                    key={tag.id}
                    value={tag.id}
                    disabled={isSelected}
                    className={cn(
                      isSelected && "opacity-50",
                      isUserInterest && "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {tag.name}
                    {isUserInterest && " ⭐"}
                  </SelectItem>
                );
              })}
            </div>
          ))}
        </SelectContent>
      </Select>

      {selectedTagIds.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedTagIds.map((tagId) => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <Badge
                  key={tagId}
                  className="bg-primary text-primary-foreground px-3 py-1.5 flex items-center gap-1.5"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tagId)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="w-full"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default MentorTagFilter;
