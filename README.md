# Create Build Number Tag

This action creates a tag with the build number in the repo.

## Inputs

- `prefix`: Prefix for tag. Default: 'build-number-'
- `token`: GitHub token to create tag

## Outputs

- `build_number`: New build number. Output in case subsequent steps want to use it

## Example usage

```yaml
uses: marohrdanz/build-number-tag@main
with:
  token: ${{ secrets.TOKEN }}
  prefix: 'my-build-number-'
```

Heavily inspired by https://github.com/onyxmueller

