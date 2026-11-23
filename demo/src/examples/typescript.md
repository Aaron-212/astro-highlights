```ts title="src/articles.ts"
interface Article {
  title: string;
  published: boolean;
}

function publishedTitles(articles: Article[]): string[] {
  return articles.filter(({ published }) => published).map(({ title }) => title);
}
```
