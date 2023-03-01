# Create Build Number Tag

This action creates a tag in the repo with the build number in the repo, with optional version number.

To determine the build number, this action examines the existing tags in the repo matching the 
prefix (default prefix 'build-'), finds the largest existing number, and increments it by 1.

For example, if the repo has existing tags: 'build-1', 'build-2', 'build-3', this action 
will create a new tag 'build-4'.

## Inputs

- `prefix`: Prefix for tag. Default: 'build-'
- `token`: GitHub token to create tag
- `version_prefix`: Optional prefix to prefix :laughing:
  - This is for uses who want tags such as '\<version\_number\>-build-\<build\_number\>',    
    e.g. '2.3.1-build-4'

## Outputs

- `build_number`: New build number. Output in case subsequent workflow steps want to use it.

## Example usage

The following will create a tag 'build-\<build\_number\>':

```yaml
uses: marohrdanz/build-number-tag@v1.0.0
with:
  token: ${{ secrets.TOKEN }}
```

The following will create a tag 'my-build-number-\<build\_number\>':

```yaml
uses: marohrdanz/build-number-tag@v1.0.0
with:
  prefix: 'my-build-number-'
  token: ${{ secrets.TOKEN }}
```

The following will create a tag '3.4.2-my-build-number-\<build\_number\>':

```yaml
uses: marohrdanz/build-number-tag@v1.0.0
with:
  prefix: '-my-build-number-'
  token: ${{ secrets.TOKEN }}
  version_prefix: "3.4.2"
```

Heavily inspired by https://github.com/onyxmueller

