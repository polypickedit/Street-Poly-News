import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Person {
  id: string;
  name: string;
  slug: string;
}

interface PostTagsProps {
  categories?: Category[];
  people?: Person[];
}

export function PostTags({ categories, people }: PostTagsProps) {
  if (!categories?.length && !people?.length) return null;

  return (
    <div className="border-t border-border pt-6 mt-8">
      <h3 className="font-display text-lg text-foreground mb-4 uppercase tracking-wider">
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className="px-3 py-1.5 text-sm font-body font-semibold uppercase tracking-wider rounded transition-all hover:scale-105"
            style={{ 
              backgroundColor: cat.color || 'hsl(var(--primary))', 
              color: 'white' 
            }}
          >
            {cat.name}
          </Link>
        ))}
        {people?.map((person) => (
          <Link
            key={person.id}
            to={`/person/${person.slug}`}
            className="px-3 py-1.5 bg-muted text-muted-foreground text-sm font-body font-semibold uppercase tracking-wider rounded transition-all hover:bg-dem hover:text-dem-foreground"
          >
            {person.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
