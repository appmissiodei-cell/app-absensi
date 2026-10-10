#!/usr/bin/env bash
# Membuka file backup terenkripsi yang diunduh dari GitHub Actions (tab Actions -> run -> Artifacts).
# Pemakaian:   bash scripts/decrypt-backup.sh backup-20261010.tar.gz.enc
# Akan diminta kata sandi (isi BACKUP_PASSPHRASE). Hasil: folder "backup/" berisi JSON + CSV.
# Hasilnya DATA PRIBADI: simpan hanya di tempat aman dan hapus setelah selesai dipakai.
set -euo pipefail
f="${1:?Sebutkan nama file .enc}"
umask 077
read -r -s -p "Kata sandi backup: " PASS; echo
export PASS
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:PASS -in "$f" | tar -xzf -
unset PASS
echo "Selesai. Lihat folder backup/"
