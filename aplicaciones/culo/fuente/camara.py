#!/usr/bin/python3

"""Compatibilidad: ejecuta el servidor canónico ubicado en /camara."""

from pathlib import Path
from runpy import run_path


run_path(str(Path(__file__).resolve().parents[3] / "camara" / "camara.py"), run_name="__main__")
