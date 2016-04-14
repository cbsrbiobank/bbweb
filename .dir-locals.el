((nil . ((fill-column . 110)
         (projectile-test-suffix-function . (lambda (project-type) "" "Spec"))
         (eval . (setq eclimd-default-workspace
                       (concat (locate-dominating-file default-directory ".dir-locals.el") "..")))
         (eval . (setq projectile-find-dir-includes-top-level t))
         (eval . (setq-default indent-tabs-mode nil))
         (eval . (global-set-key [f5] 'sbt-command))
         (eval . (defun bbweb-projectile-create-test-file (impl-file-path)
                   (let* ((test-file (projectile--test-name-for-impl-name impl-file-path))
                          (test-dir (replace-regexp-in-string "app/" "test/" (file-name-directory impl-file-path))))
                     (unless (file-exists-p (expand-file-name test-file test-dir))
                       (progn (unless (file-exists-p test-dir)
                                (make-directory test-dir :create-parents))
                              (concat test-dir test-file))))))
         (eval . (defun bbweb-projectile-find-and-create-test-file ()
                   "Open matching implementation or test file in other window."
                   (interactive)
                   (find-file
                    (bbweb-projectile-create-test-file (buffer-file-name))))))))
