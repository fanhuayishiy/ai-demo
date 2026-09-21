import type { Device, Room, PresetId } from "./types";
export const rooms: Room[] = [
  {
    id: "all",
    name: "全屋总览",
    english: "Entire home",
    area: 108,
    center: [0, 0, 0],
  },
  {
    id: "living",
    name: "客厅",
    english: "Living room",
    area: 22.8,
    center: [0, 0, 1.7],
  },
  {
    id: "bedroom",
    name: "主卧",
    english: "Bedroom",
    area: 20.4,
    center: [-4, 0, -2],
  },
  {
    id: "study",
    name: "书房",
    english: "Study",
    area: 15.9,
    center: [0, 0, -2.6],
  },
  {
    id: "kitchen",
    name: "餐厨",
    english: "Kitchen & dining",
    area: 25.9,
    center: [4, 0, -1],
  },
  {
    id: "bathroom",
    name: "卫浴",
    english: "Bathroom",
    area: 15.6,
    center: [-4, 0, 2.5],
  },
  {
    id: "balcony",
    name: "阳台",
    english: "Balcony",
    area: 7.4,
    center: [4, 0, 3.5],
  },
];
export const initialDevices: Device[] = [
  {
    id: "living-pendant",
    name: "客厅环形吊灯",
    room: "living",
    type: "light",
    on: true,
    value: 75,
    temperature: 3000,
    watts: 42,
    position: [0, 2.5, 1.3],
  },
  {
    id: "living-floor",
    name: "沙发落地灯",
    room: "living",
    type: "light",
    on: true,
    value: 55,
    temperature: 2700,
    watts: 12,
    position: [-1.35, 1.65, 3.4],
  },
  {
    id: "living-strip",
    name: "电视氛围灯",
    room: "living",
    type: "light",
    on: true,
    value: 40,
    temperature: 3200,
    watts: 18,
    position: [0.2, 0.65, -0.53],
  },
  {
    id: "living-tv",
    name: "客厅电视",
    room: "living",
    type: "tv",
    on: false,
    value: 35,
    mode: "艺术画廊",
    watts: 120,
    position: [0.25, 1.35, -0.6],
  },
  {
    id: "living-ac",
    name: "客厅空调",
    room: "living",
    type: "ac",
    on: true,
    value: 24,
    mode: "制冷",
    watts: 820,
    position: [1.55, 2.28, -0.62],
  },
  {
    id: "living-robot",
    name: "扫地机器人",
    room: "living",
    type: "robot",
    on: false,
    value: 85,
    mode: "全屋清扫",
    watts: 35,
    position: [1.75, 0.16, 3.65],
  },
  {
    id: "living-speaker",
    name: "智能音箱",
    room: "living",
    type: "speaker",
    on: false,
    value: 30,
    mode: "轻柔爵士",
    watts: 8,
    position: [1.45, 0.66, -0.42],
  },
  {
    id: "bedroom-main",
    name: "卧室吸顶灯",
    room: "bedroom",
    type: "light",
    on: true,
    value: 60,
    temperature: 3000,
    watts: 28,
    position: [-4, 2.6, -1.6],
  },
  {
    id: "bedroom-bedside",
    name: "床头阅读灯",
    room: "bedroom",
    type: "light",
    on: false,
    value: 45,
    temperature: 2700,
    watts: 7,
    position: [-5.4, 0.95, -3.1],
  },
  {
    id: "bedroom-ac",
    name: "卧室空调",
    room: "bedroom",
    type: "ac",
    on: false,
    value: 25,
    mode: "睡眠",
    watts: 650,
    position: [-2.17, 2.25, -2.7],
  },
  {
    id: "bedroom-curtain",
    name: "卧室窗帘",
    room: "bedroom",
    type: "curtain",
    on: true,
    value: 70,
    watts: 0,
    position: [-5.79, 1.5, -1.25],
  },
  {
    id: "study-main",
    name: "书房吊灯",
    room: "study",
    type: "light",
    on: false,
    value: 80,
    temperature: 4000,
    watts: 24,
    position: [0, 2.55, -2.65],
  },
  {
    id: "study-desk",
    name: "书桌台灯",
    room: "study",
    type: "light",
    on: true,
    value: 65,
    temperature: 4000,
    watts: 9,
    position: [0.8, 1.25, -3.7],
  },
  {
    id: "kitchen-main",
    name: "餐桌吊灯",
    room: "kitchen",
    type: "light",
    on: true,
    value: 75,
    temperature: 3000,
    watts: 25,
    position: [3.65, 2.4, 0.85],
  },
  {
    id: "kitchen-task",
    name: "橱柜工作灯",
    room: "kitchen",
    type: "light",
    on: true,
    value: 90,
    temperature: 4000,
    watts: 16,
    position: [4, 1.65, -3.95],
  },
  {
    id: "kitchen-fridge",
    name: "双门冰箱",
    room: "kitchen",
    type: "fridge",
    on: true,
    value: 4,
    mode: "智能保鲜",
    watts: 90,
    position: [5.25, 1.1, -3.85],
  },
  {
    id: "kitchen-hood",
    name: "抽油烟机",
    room: "kitchen",
    type: "hood",
    on: false,
    value: 2,
    mode: "自动",
    watts: 180,
    position: [3.25, 1.9, -4.05],
  },
  {
    id: "kitchen-oven",
    name: "嵌入式烤箱",
    room: "kitchen",
    type: "oven",
    on: false,
    value: 180,
    mode: "上下烘烤",
    watts: 1500,
    position: [3.25, 0.5, -3.95],
  },
  {
    id: "bathroom-main",
    name: "浴室镜前灯",
    room: "bathroom",
    type: "light",
    on: false,
    value: 85,
    temperature: 4000,
    watts: 18,
    position: [-5.73, 2, 1.75],
  },
  {
    id: "bathroom-heater",
    name: "智能热水器",
    room: "bathroom",
    type: "heater",
    on: true,
    value: 45,
    mode: "节能",
    watts: 1200,
    position: [-2.3, 2.1, 0.92],
  },
  {
    id: "balcony-main",
    name: "阳台壁灯",
    room: "balcony",
    type: "light",
    on: false,
    value: 65,
    temperature: 3000,
    watts: 12,
    position: [5.73, 1.9, 3.1],
  },
  {
    id: "balcony-washer",
    name: "洗烘一体机",
    room: "balcony",
    type: "washer",
    on: false,
    value: 40,
    mode: "日常洗",
    watts: 500,
    position: [5.3, 0.53, 3.65],
  },
];
export function applyPreset(devices: Device[], preset: PresetId): Device[] {
  return devices.map((d) => {
    if (preset === "away") return { ...d, on: d.type === "fridge" };
    if (preset === "night")
      return {
        ...d,
        on: ["bedroom-bedside", "bedroom-ac", "kitchen-fridge"].includes(d.id),
        ...(d.type === "light" ? { value: 20 } : {}),
        ...(d.type === "curtain" ? { value: 0 } : {}),
      };
    if (preset === "movie")
      return {
        ...d,
        on: [
          "living-tv",
          "living-strip",
          "living-floor",
          "living-ac",
          "kitchen-fridge",
        ].includes(d.id),
        ...(d.type === "light"
          ? { value: d.id === "living-strip" ? 35 : 18 }
          : {}),
        ...(d.type === "curtain" ? { value: 0 } : {}),
      };
    const original = initialDevices.find((v) => v.id === d.id)!;
    return { ...original };
  });
}
export const STORAGE_KEY = "habitat-home-v1";
export function readDevices(): Device[] {
  const defaults = () => initialDevices.map((device) => ({ ...device }));
  const limits: Partial<Record<Device["type"], readonly [number, number]>> = {
    hood: [1, 3],
    washer: [20, 60],
    oven: [80, 250],
    ac: [16, 30],
    fridge: [2, 8],
    heater: [35, 65],
  };
  const modes: Partial<Record<Device["type"], readonly string[]>> = {
    ac: ["制冷", "制热", "送风", "睡眠"],
    tv: ["艺术画廊", "电影", "音乐"],
    washer: ["日常洗", "轻柔洗", "快速洗"],
    oven: ["上下烘烤", "热风", "烧烤"],
    robot: ["全屋清扫", "沿边清扫", "定点清扫"],
    speaker: ["轻柔爵士", "自然白噪音", "钢琴"],
    hood: ["自动", "手动"],
    heater: ["节能", "速热"],
    fridge: ["智能保鲜", "假日", "速冷"],
  };
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );
    if (!Array.isArray(saved)) return defaults();
    const entries = (saved as unknown[]).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" &&
        entry !== null &&
        !Array.isArray(entry) &&
        typeof (entry as Record<string, unknown>).id === "string",
    );
    return initialDevices.map((device) => {
      const old = entries.find((entry) => entry.id === device.id);
      if (
        !old ||
        typeof old.on !== "boolean" ||
        typeof old.value !== "number" ||
        !Number.isFinite(old.value)
      )
        return { ...device };
      const [minimum, maximum] = limits[device.type] ?? [0, 100];
      const restored: Device = {
        ...device,
        on: old.on,
        value: Math.max(minimum, Math.min(maximum, old.value)),
      };
      if (
        device.type === "light" &&
        typeof old.temperature === "number" &&
        Number.isFinite(old.temperature)
      ) {
        restored.temperature = Math.max(2700, Math.min(6500, old.temperature));
      }
      if (
        typeof old.mode === "string" &&
        modes[device.type]?.includes(old.mode)
      )
        restored.mode = old.mode;
      return restored;
    });
  } catch {
    return defaults();
  }
}
