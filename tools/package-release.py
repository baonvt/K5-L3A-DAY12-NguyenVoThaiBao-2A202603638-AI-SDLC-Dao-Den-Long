"""Build the offline web game plus its local Node server, without development packages."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256

root = Path(__file__).resolve().parents[1]
dest = root / "dist"
dest.mkdir(exist_ok=True)
asset = dest / "dao-den-long-v1.0.0.zip"
files = [
    "index.html", "style.css", "game.contract.json", "LICENSE", "CREDITS.md",
    "tools/serve.js", "tools/leaderboard.js", "tools/headless.js", "tools/validate.js", "tools/soak.js",
    "node_modules/three/build/three.module.js", "node_modules/three/LICENSE"
]
files += [p.relative_to(root).as_posix() for p in sorted((root / "src").glob("*.js"))]
with ZipFile(asset, "w", ZIP_DEFLATED) as out:
    for name in files:
        out.write(root / name, name)
    out.writestr("package.json", '{"name":"dao-den-long","version":"1.0.0","type":"module","scripts":{"start":"node tools/serve.js"}}\n')
    out.writestr("CHAY-GAME.txt", "ĐẢO ĐÈN LỒNG v1.0.0\nGiải nén, mở terminal trong thư mục này, dùng Node.js 20+ chạy:\nnode tools/serve.js\nMở http://127.0.0.1:4173/ để chơi. Ctrl+C để dừng.\nXuất bảng điểm: node tools/serve.js --export-leaderboard out.json\nGói này cũng dùng được trên máy chủ web tĩnh; khi đó điểm thuộc dữ liệu của trình duyệt.\nMã nguồn, test và công cụ benchmark nằm trong Source code của Release.\n")
print(asset.name, asset.stat().st_size, sha256(asset.read_bytes()).hexdigest())
