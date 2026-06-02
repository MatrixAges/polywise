1. Move release asset collection logic from the desktop workflow source into a root automation script under scripts/.
2. Replace the Cloudflare R2 asset existence check with a repository script under scripts/ for consistency with the asset collection step.
3. Regenerate the workflow YAML and format the touched files.
