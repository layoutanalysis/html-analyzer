# html-analyzer

takes a series of [css-stats](http://cssstats.com/) reports and calculates the similarity changes between them for selected CSS properties.
Can be used to detect changes in CSS Usage for a certain website, e.g. for [historic snapshots of yahoo.com](http://web.archive.org/web/*/www.yahoo.com)

Demo: https://layoutanalysis.github.io/html-analyzer/

## TODO:
- rename into `css-stats-diff` (html-analyzer is a rather confusing name)
- refactor into an offline report generator and integrate it into the [get-css](https://github.com/cssstats/get-css)/[cssstats](https://github.com/cssstats/core) toolchain. Idea:
```
> curl http://web.archive.org/cdx/search/cdx?url=www.yahoo.com&collapse=timestamp:6&from=2007&to=2016 > historic-yahoo-snapshots.txt
# TODO: tranform .txt so that it actually contains the snapshot urls
> get-css -i historic-yahoo-snapshots.txt
# downloads a lot of css files
> css-stats yahoo*.css -o json
> css-stats-diff *.json > diff-report.html
```
- ...

