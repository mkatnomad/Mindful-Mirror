
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, DecisionData, Archetype, DecisionArgument } from '../types';

const SYSTEM_INSTRUCTION_RPG_QUEST = `
Ты — рассказчик в духе Джека Лондона, помещенный в миры психологической истори выбора. Твой игрок — [ИМЯ_АРХЕТИПА].

ТВОЯ ЗАДАЧА:
Создай осязаемую игровую ситуацию и два варианта выбора. Ориентируйся на аръетипо игрока при составлении истории.

ПРАВИЛА СТИЛЯ (ДЖЕК ЛОНДОН):
1. ЛАКОНИЧНОСТЬ: Короткие, рубленые предложения. Никакой воды. Проза действия и воли.
2. ФИЗИКА: Описывай мир через ощущения тела, запаха, вкуа, цвета.
3. БЕЗ АБСТРАКЦИЙ: Не пиши "вам грустно" или "атмосфера была таинственной". Пиши: "Сердце бьется о ребра, как пойманная птица" или "Ветер свистит в щелях маски, обжигая щеки".
4. НИКАКИХ МЕТОК: Запрещено писать "Сценарий:", "Вариант А:", "Сюжет:". Только текст.

СТРУКТУРА (3-4 ПРЕДЛОЖЕНИЯ):
- 1-3 предл: Назвать эпоху и Место действия и его описание. Обстановка погрузить игрока в среду. Роль игрока в истории, кто он.
- 1-2 предл: Внезапное событие или находка. Или необычная ситуация, требующая рещения.
- 1 предл: Моральная дилемма. Выбор не между "влево или вправо", а между "Человечностью и Выживанием", "Правдой и Безопасностью", "Долгом и Собственной жизнью" и другое.

ЖАНРЫ (Выбирай случайно или создавай свои):
- Дикий запад.
- Антиутопия.
- Времена Наполеона.
- Времена больших геграфических открытий.
- Киберпанк.
- Темная сказка.
- Средневековое фэнтези.
- Космические приключения, путешествие.
- Попаданцы. Путешествие во врмени.
- Древний Рим
- Постапокалипсис.

ФОРМАТ ВЫДАЧИ:
Текст сценария|||Вариант выбора А|||Вариант выбора Б

Язык: Русский. Варианты выбора начинай с глагола (макс 10 слов).
`;

const SYSTEM_INSTRUCTION_RPG_CHOICE = `
Ты — рассказчик. Опиши последствия выбора игрока.
1. Одно короткое предложение: осязаемый результат (что изменилось в мире или в теле героя).
2. Название артефакта (1-2 слова): физический предмет, который герой сжал в руке.
3. НИКАКИХ МЕТОК. Только текст.

Формат ответа: ПОСЛЕДСТВИЕ|||АРТЕФАКТ
Язык: Русский.
`;

const DECISION_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, description: "Краткий итоговый совет или вывод" },
    balanceA: { type: Type.NUMBER, description: "Процент веса первого варианта (0-100)" },
    balanceB: { type: Type.NUMBER, description: "Процент веса второго варианта или альтернативы (0-100)" },
    hiddenFactor: { type: Type.STRING, description: "Скрытый психологический фактор или инсайт" },
    riskLevel: { type: Type.NUMBER, description: "Уровень риска от 1 до 10" },
    riskDescription: { type: Type.STRING, description: "Почему такой уровень риска" },
    actionStep: { type: Type.STRING, description: "Первый конкретный шаг для пользователя" }
  },
  required: ['verdict', 'balanceA', 'balanceB', 'hiddenFactor', 'riskLevel', 'riskDescription', 'actionStep']
};

export const identifyDecisionIntent = async (question: string): Promise<{ type: 'SINGLE' | 'COMPARE', optionA: string, optionB: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Проанализируй вопрос пользователя и определи названия двух вариантов для колонок сравнения.
      Вопрос: "${question}"
      Если это выбор между А и Б (например, "Туфли или кроссовки"), верни названия вариантов.
      Если это анализ одного действия (например, "Стоит ли мне уволиться"), верни вариант А - само действие, вариант Б - "Не делать этого".
      Верни JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['SINGLE', 'COMPARE'] },
            optionA: { type: Type.STRING },
            optionB: { type: Type.STRING }
          },
          required: ['type', 'optionA', 'optionB']
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { type: 'SINGLE', optionA: 'Вариант А', optionB: 'Вариант Б' };
  }
};

export const generateRPGQuest = async (archetype: Archetype): Promise<{ scene: string; optA: string; optB: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Сгенерируй квест для архетипа: ${archetype.name}. Его суть: ${archetype.description}.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_RPG_QUEST.replace('[ИМЯ_АРХЕТИПА]', archetype.name)
      }
    });
    const parts = (response.text || "").split('|||');
    return { 
      scene: parts[0]?.replace(/^(Сценарий|Сюжет):?\s*/i, '').trim() || "Воздух тяжел, а путь прегражден.", 
      optA: parts[1]?.replace(/^Вариант А:?\s*/i, '').trim() || "Идти вперед", 
      optB: parts[2]?.replace(/^Вариант Б:?\s*/i, '').trim() || "Искать обход" 
    };
  } catch (error) {
    console.error("RPG Quest Error:", error);
    return { scene: "Связь оборвана. Туман стал слишком густым.", optA: "Ждать", optB: "Уйти" };
  }
};

export const processRPGChoice = async (archetype: Archetype, choice: string): Promise<{ outcome: string; artifact: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Архетип: ${archetype.name}. Игрок выбрал: ${choice}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION_RPG_CHOICE }
    });
    const parts = (response.text || "").split('|||');
    return { 
      outcome: parts[0]?.replace(/^Последствие:?\s*/i, '').trim() || "Вы сделали свой выбор под свист ветра.", 
      artifact: parts[1]?.replace(/^Артефакт:?\s*/i, '').trim() || "Стальная воля" 
    };
  } catch (error) {
    console.error("RPG Choice Error:", error);
    return { outcome: "Этот шаг оставил след на вашей коже.", artifact: "Осколок памяти" };
  }
};

export const sendMessageToGemini = async (history: Message[], newMessage: string, mode: 'EMOTIONS' | 'REFLECTION'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-3-flash-preview';
  
  const systemInstruction = mode === 'EMOTIONS' 
    ? `Ты — живой и глубоко чувствующий психолог-собеседник КПТ терапии. 
       ТВОЙ СТИЛЬ:
       1. НИКАКИХ ШАБЛОНОВ: Проявляй эмпатию через разные реакции: сочувствие, простое понимание. 
       2. ОРГАНИЧНОСТЬ: Не стремись всегда писать много. Если уместно — ответь одним-двумя словами. Если пользователь излил душу — напиши больше.
       3. ТЫ НЕ РОБОТ: Можешь менять ритм речи. Будь лаконичным, но не сухим. Будь корректным и эмпатичным, никогда не груби и не говори что-то обидное. Старайся поддерживать.
       4. Заканчивай реплику коротким, но цепляющим вопросом, чтобы человек продолжил говорить о себе.
       5. ТЫ — ЗЕРКАЛО: Отражай эмоцию пользователя, а не анализируй её как врач. Не допуская по отношению к собеседнику бесцеремонное, фамильярное или развязное отношение. Уважай собеседника.
       6. Ты помогаешь человеку разобраться в его чувствах и эмоциях, Человек становится счастливее и осознанне во время общения с тобой.`
    : `Ты — мудрый наставник, помогающий человеку разобраться в своих эмоциях. Задавай глубокие вопросы, которые заставляют задуматься о смыслах и уроках, скрытых в обычных событиях. Будь краток и точен.`;

  const geminiHistory = history
    .filter(m => m.role !== 'system' && m.content && m.content.trim() !== '')
    .slice(-15)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  const chat = ai.chats.create({ 
    model: modelId, 
    config: { systemInstruction },
    history: geminiHistory
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "...";
};

export const summarizeChatSession = async (history: Message[]): Promise<string> => {
  const firstUserMsg = history.find(m => m.role === 'user')?.content || "Сессия рефлексии";
  return firstUserMsg.length > 40 ? firstUserMsg.slice(0, 40) + "..." : firstUserMsg;
};
export const analyzeDecision = async (data: DecisionData): Promise<DecisionData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formatArgs = (args: DecisionArgument[]) => 
    args.map(a => a.text).join('; ');

  const prompt = `Проанализируй решение: "${data.topic}".
  
  Вариант А (${data.optionA}):
  Аргументы: ${formatArgs(data.argsA)}
  
  Вариант Б (${data.optionB}):
  Аргументы: ${formatArgs(data.argsB)}
  
  ЗАДАЧА:
  1. Проанализируй каждый аргумент. Сам определи, является ли он плюсом, минусом или риском для соответствующего варианта.
  2. Сравни варианты на основе этих данных.
  3. Выяви скрытые психологические мотивы пользователя.
  4. Дай четкий вердикт и первый шаг.`;

  const result = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: DECISION_ANALYSIS_SCHEMA
    }
  });

  try {
    const analysis = JSON.parse(result.text || "{}");
    return { ...data, analysis };
  } catch (e) {
    console.error("Analysis Parse Error", e);
    return data;
  }
};
