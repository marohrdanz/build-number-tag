# Create Build Number Tag

This action creates a tag with the build number in the repo, with optional version number.

## Inputs

- `prefix`: Prefix for tag. Default: 'build-number-'
- `token`: GitHub token to create tag
- `version_prefix`: Optional prefix to prefix :laughing:
  - This is for uses who want tags such as '\<version\_number\>-build-number-\<build\_number\>',
    e.g. '2.3.1-build-number-4'

## Outputs

- `build_number`: New build number. Output in case subsequent steps want to use it

## Example usage

The following will create a tag 'my-build-number-\<build\_number\>'

```yaml
uses: marohrdanz/build-number-tag@main
with:
  prefix: 'my-build-number-'
  token: ${{ secrets.TOKEN }}
```

The following will create a tag '3.4.2-build-number-\<build\_number\>'

```yaml
uses: marohrdanz/build-number-tag@main
with:
  prefix: '-build-number-'
  token: ${{ secrets.TOKEN }}
  version_prefix: "3.4.2"
```

Heavily inspired by https://github.com/onyxmueller

