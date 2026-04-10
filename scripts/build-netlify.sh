#!/bin/bash
# Build script for landscape2 on Netlify
# This script builds landscape2 from source code

set -e

echo "=== Installing Rust 1.92.0 ==="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.92.0
source "$HOME/.cargo/env"

echo "=== Installing wasm-pack ==="
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

echo "=== Installing yarn (if not present) ==="
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
fi

echo "=== Building landscape2 CLI (includes wasm and webapp) ==="
cargo build --release -p landscape2

echo "=== Running landscape2 build with ainative data ==="
./target/release/landscape2 build \
  --data-file ainative/data.yml \
  --settings-file ainative/settings.yml \
  --guide-file ainative/guide.yml \
  --games-file ainative/games.yml \
  --logos-path ainative/logos \
  --output-dir build

echo "=== Build completed successfully ==="
ls -la build/