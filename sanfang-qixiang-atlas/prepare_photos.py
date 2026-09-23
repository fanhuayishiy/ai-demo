"""Fetch attributed Commons photographs. Run with Python + beautifulsoup4."""
import concurrent.futures
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent
FILES = {
    'heart-tree': ('Tree_of_Heart,_Sanfang_Qixiang_20230825.jpg', '南后街爱心树 · 2023年8月'),
    'linzexu': ('林文忠公祠屏门.jpg', '林则徐纪念馆 · 林文忠公祠屏门'),
    'nanhou': ('20231020_Nanhou_Jie.jpg', '南后街街景'),
    'yanfu': ('Former_Residence_of_Yan_Fu_in_Langguan_Alley,_2019-09-29_03.jpg', '严复故居'),
    'bingxin': ('Former_Residence_of_Lin_Juemin,_2019-09-29_05.jpg', '林觉民·冰心故居'),
    'shuixie': ('Water-side_Performing_Stage_at_Yijin_Lane,_2019-09-29_20.jpg', '衣锦坊水榭戏台'),
    'xiaohuang': ('House_of_Huang_Family_at_Huang_Alley,_2019-09-29_27.jpg', '黄巷小黄楼'),
    'ermei': ('Ermei_House,_2019-09-29_02.jpg', '二梅书屋'),
    'guanglu-garden': ('福州南后街玉尺山（石刻、古池、桥）_-_panoramio.jpg', '光禄吟台所在的玉尺山园林'),
    'guanglu': ('Residence_of_Liu_Family_at_Guanglu_Lane,_2019-09-29_01.jpg', '光禄坊刘家大院'),
    'yijin': ('Residence_of_Ouyang_Family_at_Yijin_Lane,_2019-09-29.jpg', '衣锦坊欧阳氏民居'),
    'wenru': ('Wenlufang_in_Fuzhou_in_March_21,2015.JPG', '文儒坊街景'),
    'yangqiao': ('Former_Residence_of_Lin_Juemin,_2019-09-29_05.jpg', '杨桥路沿线 · 林觉民故居'),
    'langguan': ('Langguan_alley.JPG', '郎官巷街景'),
    'taxiang': ('塔巷入口.jpg', '塔巷入口'),
    'huangxiang': ('黄巷入口.jpg', '黄巷入口'),
    'anmin': ('安民巷南后街东.jpg', '安民巷街景'),
    'gongxiang': ('Gung-haeng.jpg', '宫巷街景'),
    'jipi': ('Ancestral_Home_of_Xie_Family_at_Jibi_Alley,_2019-09-31.jpg', '吉庇巷谢家祠'),
    'intangible': ('Residence_of_Ye_Family_at_Nanhou_Street,_2019-09-29_01.jpg', '非遗博览苑所在的叶氏民居'),
}

def get(url):
    return urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40).read()

def fetch(item):
    key, (filename, caption) = item
    source = 'https://commons.wikimedia.org/wiki/File:' + quote(filename)
    soup = BeautifulSoup(get(source), 'html.parser')
    author = soup.select_one('#fileinfotpl_aut')
    author = author.find_next_sibling('td').get_text(' ', strip=True)
    licenses = [e.get_text(' ', strip=True) for e in soup.select('.licensetpl_short')]
    license_name = next((x for x in licenses if x.startswith('CC BY')), None)
    if not license_name:
        raise ValueError(f'{key}: unrecognized license {licenses}')
    links = soup.select('.fullImageLink a')
    original = links[0]['href'].split('?')[0]
    image_url = next((a['href'] for a in links if '/1280px-' in a.get('href', '')), original)
    data = get(image_url)
    if data[:2] != b'\xff\xd8':
        raise ValueError(f'{key}: not a JPEG')
    (ROOT / 'public/photos' / (key + '.jpg')).write_bytes(data)
    print(key, len(data), author, license_name, flush=True)
    return key, dict(src='photos/' + key + '.jpg', caption=caption, author=author,
                     license=license_name, source=source, original=original)

if __name__ == '__main__':
    (ROOT / 'public/photos').mkdir(exist_ok=True)
    result = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch, item): item[0] for item in FILES.items()}
        for f in concurrent.futures.as_completed(futures):
            try:
                key, photo = f.result()
                result[key] = photo
            except Exception as e:
                print('FAILED', futures[f], str(e), flush=True)
    (ROOT / 'public/data/photos.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
