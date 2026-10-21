<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Provide tooltip context in the root component for every page; channel-specific views use shared tooltips and must not rely on another page's provider.
- Use shared Radix popovers with design-system link buttons for email status explanations, keeping explanatory content out of the compact status layout.
