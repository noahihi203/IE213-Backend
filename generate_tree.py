import os
import fnmatch
from pathlib import Path

GITIGNORE_FILE = ".gitignore"
OUTPUT_FILE = "project_structure.md"


DEFAULT_IGNORES = {
    ".git",
    ".DS_Store",
    "__pycache__",
    "node_modules",
    ".next",
    ".nuxt",
    ".expo",
    ".vercel",
    ".parcel-cache",
    ".turbo",
    "dist",
    "build",
    "coverage",
    ".coverage",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    ".idea",
    ".vscode",
    ".history",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "logs",
    "tmp",
    "temp",
    "venv",
    ".venv",
    "env",
    "target",
    "out",
    ".cache",
    ".sass-cache",
}


def load_gitignore():
    ignore_patterns = set(DEFAULT_IGNORES)

    if os.path.exists(GITIGNORE_FILE):
        with open(GITIGNORE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()

                if not line or line.startswith("#"):
                    continue

                ignore_patterns.add(line.rstrip("/"))

    return ignore_patterns


def should_ignore(path, ignore_patterns):
    name = path.name

    for pattern in ignore_patterns:
        if fnmatch.fnmatch(name, pattern):
            return True

    return False


def generate_tree(directory, ignore_patterns, prefix=""):
    entries = sorted(
        [e for e in directory.iterdir() if not should_ignore(e, ignore_patterns)],
        key=lambda e: (not e.is_dir(), e.name.lower())
    )

    tree = ""

    for i, entry in enumerate(entries):

        connector = "└── " if i == len(entries) - 1 else "├── "

        tree += prefix + connector + entry.name + "\n"

        if entry.is_dir():
            extension = "    " if i == len(entries) - 1 else "│   "
            tree += generate_tree(entry, ignore_patterns, prefix + extension)

    return tree


root_path = Path(".").resolve()
ignore_patterns = load_gitignore()

tree_output = "# Project Structure\n\n```\n"
tree_output += root_path.name + "\n"
tree_output += generate_tree(root_path, ignore_patterns)
tree_output += "```"


with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(tree_output)

print(f"Tree written to {OUTPUT_FILE}")