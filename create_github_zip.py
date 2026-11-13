import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "APP"
APP.mkdir(exist_ok=True)

output_zip_root = ROOT / "NTTF_M3B_GitHub_Repo.zip"
output_zip_app = APP / "NTTF_M3B_GitHub_Repo.zip"

EXCLUDE_DIRS = {'.git', 'node_modules', '.gradle', '.idea', '.vscode'}
EXCLUDE_EXTS = {'.log'}
EXCLUDE_FILES = {'NTTF_M3B_GitHub_Repo.zip', 'NTTF_M3B_Birthdays_Render.zip'}

print("Creating GitHub Repository ZIP for Render deployment...")

def make_repo_zip(dest_zip):
    with zipfile.ZipFile(dest_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ROOT):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES or any(file.endswith(ext) for ext in EXCLUDE_EXTS):
                    continue
                file_path = Path(root) / file
                arcname = file_path.relative_to(ROOT)
                zf.write(file_path, arcname)

make_repo_zip(output_zip_root)
print(f"Created Root ZIP: {output_zip_root} ({os.path.getsize(output_zip_root):,} bytes)")

# Copy to APP folder as well
import shutil
shutil.copy2(output_zip_root, output_zip_app)
print(f"Copied ZIP to APP folder: {output_zip_app} ({os.path.getsize(output_zip_app):,} bytes)")
