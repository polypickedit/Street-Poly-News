import { useEffect } from "react";

interface DisqusCommentsProps {
  postId: string;
  title: string;
}

export function DisqusComments({ postId, title }: DisqusCommentsProps) {
  useEffect(() => {
    // Reset Disqus when post changes
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function (this: { page: { identifier: string; url: string; title: string } }) {
          this.page.identifier = postId;
          this.page.url = window.location.href;
          this.page.title = title;
        },
      });
    } else {
      // Load Disqus script
      const d = document;
      const s = d.createElement("script");
      s.src = "https://streetpoliticsnews.disqus.com/embed.js";
      s.setAttribute("data-timestamp", String(+new Date()));
      (d.head || d.body).appendChild(s);
    }
  }, [postId, title]);

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="font-display text-2xl text-foreground mb-4">Comments</h3>
      <div id="disqus_thread"></div>
      <noscript>
        Please enable JavaScript to view the comments powered by Disqus.
      </noscript>
    </div>
  );
}

// Add Disqus types to window
declare global {
  interface Window {
    DISQUS?: {
      reset: (config: {
        reload: boolean;
        config: (this: { page: { identifier: string; url: string; title: string } }) => void;
      }) => void;
    };
  }
}