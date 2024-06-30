# Experiment: Evolution Controller

プログラムの進化を外部プロセスが担う。

operation: cmd, write, editignore

AI returns operations[], whose result is a new epoch.

- cmd
    - any
    - commonly:
        - mkdir
        - touch
        - rm -rf
        - deno run -A

editignore: Edit files to exclude to submit to AI