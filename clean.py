from pathlib import Path
import time

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"


def cleanup_folder(folder: Path, max_age_seconds: int | None = None):
    """
    清理指定文件夹中的文件。

    max_age_seconds:
        - None：删除文件夹内所有文件
        - 数字：只删除超过指定秒数的旧文件
    """
    if not folder.exists():
        print(f"文件夹不存在，跳过：{folder}")
        return

    deleted_count = 0
    skipped_count = 0
    now = time.time()

    for path in folder.iterdir():
        if not path.is_file():
            skipped_count += 1
            continue

        if max_age_seconds is not None:
            file_age = now - path.stat().st_mtime
            if file_age <= max_age_seconds:
                skipped_count += 1
                continue

        try:
            path.unlink()
            deleted_count += 1
            print(f"已删除：{path.name}")
        except PermissionError:
            skipped_count += 1
            print(f"文件被占用，跳过：{path.name}")
        except Exception as exc:
            skipped_count += 1
            print(f"删除失败：{path.name}，原因：{exc}")

    print(f"\n{folder.name} 清理完成：删除 {deleted_count} 个，跳过 {skipped_count} 个")


def main():
    print("开始清理临时文件...\n")

    # 当前开发阶段：直接清空 uploads 和 output 里的文件
    cleanup_folder(UPLOAD_DIR, max_age_seconds=None)
    print()
    cleanup_folder(OUTPUT_DIR, max_age_seconds=None)

    print("\n清理完成。")


if __name__ == "__main__":
    main()