```ts title="src/articles.ts" copyButton=true
interface Article {
  title: string;
  published: boolean;
}

function publishedTitles(articles: Article[]): string[] {
  return articles.filter(({ published }) => published).map(({ title }) => title);
}
```
