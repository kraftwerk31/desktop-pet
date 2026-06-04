/**
 * Lightweight i18n layer for UI labels and localized dialogue packs.
 */
(function () {
  'use strict';

  var SETTINGS_KEY = 'desktop-pet-settings';
  var originalPersonalities = null;

  var UI = {
    'zh-CN': {
      appTitle: '桌面宠物 - 你的小伙伴',
      closeTitle: '再见~',
      settings: '设置',
      language: '语言',
      modeSelection: '模式选择',
      companion: '陪伴',
      reminder: '提醒',
      modeDesc: {
        companion: '猫咪在桌面上走来走去，到时间走过来提醒你。',
        reminder: '猫咪平时隐藏，到时间才弹出来提醒，提醒完缩回去。',
      },
      personalitySelection: '性格选择',
      healthReminder: '健康提醒',
      breakActivity: '休息活动',
      waterReminder: '喝水提醒',
      generalSettings: '通用设置',
      autoStart: '开机自动启动',
      stats: {
        consecutiveDays: '连续陪伴',
        interactions: '互动次数',
        todayData: '今日数据',
        responseRate: '提醒响应率',
        sessionTime: '使用时长',
        reminders: '提醒次数',
      },
      bondTitles: ['新朋友', '熟悉的伙伴', '好朋友', '最佳拍档', '灵魂伴侣'],
      moodLabels: { high: '超开心', normal: '还不错', low: '有点无聊' },
      minutes: '{n}分钟',
      days: '{n}天',
      times: '{n}次',
      statsBubble: '📅 {days} · {bond} · {interactions}',
      personality: {
        clingy: { name: '🥺 粘人精', desc: '你就是我的一切！不要离开我~' },
        tsundere: { name: '😏 傲娇毒舌', desc: '哼...又不是我在乎你' },
        energetic: { name: '✨ 元气夸夸', desc: '救命！你怎么可以这么厉害！' },
        dramatic: { name: '🎭 戏精', desc: '这不是排练！这是现场直播！' },
      },
    },
    en: {
      appTitle: 'Desktop Pet - Your little companion',
      closeTitle: 'Bye~',
      settings: 'Settings',
      language: 'Language',
      modeSelection: 'Mode',
      companion: 'Companion',
      reminder: 'Reminder',
      modeDesc: {
        companion: 'The cat wanders around your desktop and comes over when it is time.',
        reminder: 'The cat stays hidden and pops in only when a reminder is due.',
      },
      personalitySelection: 'Personality',
      healthReminder: 'Health reminders',
      breakActivity: 'Movement break',
      waterReminder: 'Water reminder',
      generalSettings: 'General',
      autoStart: 'Launch at startup',
      stats: {
        consecutiveDays: 'Day streak',
        interactions: 'Interactions',
        todayData: 'Today',
        responseRate: 'Response rate',
        sessionTime: 'Session time',
        reminders: 'Reminders',
      },
      bondTitles: ['New friend', 'Familiar buddy', 'Good friend', 'Best partner', 'Soul companion'],
      moodLabels: { high: 'Very happy', normal: 'Doing fine', low: 'A bit bored' },
      minutes: '{n} min',
      days: '{n} days',
      times: '{n} times',
      statsBubble: '📅 {days} · {bond} · {interactions}',
      personality: {
        clingy: { name: '🥺 Clingy', desc: 'You are my whole world. Do not leave me~' },
        tsundere: { name: '😏 Tsundere', desc: 'Hmph... it is not like I care.' },
        energetic: { name: '✨ Hype cat', desc: 'How are you this amazing today?' },
        dramatic: { name: '🎭 Drama cat', desc: 'This is not rehearsal. This is live!' },
      },
    },
    ja: {
      appTitle: 'デスクトップペット - 小さな相棒',
      closeTitle: 'またね~',
      settings: '設定',
      language: '言語',
      modeSelection: 'モード',
      companion: '相棒',
      reminder: '通知',
      modeDesc: {
        companion: '猫がデスクトップを歩き回り、時間になると知らせに来ます。',
        reminder: '普段は隠れていて、通知の時間だけひょこっと出てきます。',
      },
      personalitySelection: '性格',
      healthReminder: '健康リマインダー',
      breakActivity: '休憩',
      waterReminder: '水分補給',
      generalSettings: '一般',
      autoStart: '起動時に自動開始',
      stats: {
        consecutiveDays: '連続日数',
        interactions: 'ふれあい',
        todayData: '今日の記録',
        responseRate: '反応率',
        sessionTime: '使用時間',
        reminders: '通知回数',
      },
      bondTitles: ['新しい友だち', 'なじみの相棒', '親友', '最高の相棒', '魂の相棒'],
      moodLabels: { high: 'ごきげん', normal: 'いい感じ', low: '少し退屈' },
      minutes: '{n}分',
      days: '{n}日',
      times: '{n}回',
      statsBubble: '📅 {days} · {bond} · {interactions}',
      personality: {
        clingy: { name: '🥺 甘えん坊', desc: 'あなたが世界のすべて。離れないで~' },
        tsundere: { name: '😏 ツンデレ', desc: 'ふん...別に心配してないし。' },
        energetic: { name: '✨ 応援係', desc: '今日もすごすぎるよ！' },
        dramatic: { name: '🎭 ドラマ猫', desc: 'これはリハーサルじゃない。本番だよ！' },
      },
    },
    es: {
      appTitle: 'Mascota de escritorio - Tu pequeña compañía',
      closeTitle: 'Adiós~',
      settings: 'Ajustes',
      language: 'Idioma',
      modeSelection: 'Modo',
      companion: 'Compañía',
      reminder: 'Recordatorio',
      modeDesc: {
        companion: 'El gato camina por el escritorio y se acerca cuando toca recordarte algo.',
        reminder: 'El gato se queda oculto y aparece solo cuando llega un recordatorio.',
      },
      personalitySelection: 'Personalidad',
      healthReminder: 'Recordatorios de salud',
      breakActivity: 'Descanso activo',
      waterReminder: 'Beber agua',
      generalSettings: 'General',
      autoStart: 'Iniciar con Windows',
      stats: {
        consecutiveDays: 'Racha',
        interactions: 'Interacciones',
        todayData: 'Hoy',
        responseRate: 'Respuesta',
        sessionTime: 'Tiempo de uso',
        reminders: 'Recordatorios',
      },
      bondTitles: ['Nuevo amigo', 'Compañero conocido', 'Buen amigo', 'Mejor compañero', 'Compañero del alma'],
      moodLabels: { high: 'Muy feliz', normal: 'Todo bien', low: 'Algo aburrido' },
      minutes: '{n} min',
      days: '{n} días',
      times: '{n} veces',
      statsBubble: '📅 {days} · {bond} · {interactions}',
      personality: {
        clingy: { name: '🥺 Pegajoso', desc: 'Eres todo mi mundo. No te vayas~' },
        tsundere: { name: '😏 Tsundere', desc: 'Bah... no es que me importes.' },
        energetic: { name: '✨ Animador', desc: '¿Cómo puedes ser tan increíble hoy?' },
        dramatic: { name: '🎭 Dramático', desc: 'Esto no es ensayo. ¡Es en vivo!' },
      },
    },
  };

  var DIALOGUE = {
    en: {
      clingy: {
        companionRemind: ['Poke poke... are you still there?', 'You have not looked at me in forever!', 'Do you have another cat now?'],
        companionEncourage: ['You are the best human ever!', 'I knew you would come back to me!'],
        companionSad: ['I can wait... I am very good at waiting.', 'Did I get too clingy again?'],
        sit: ['I will sit right here beside you.', 'Your desk is my favorite place.'],
        lookAround: ['Sniff sniff... where did you go?', 'I heard you move. I am checking.'],
        yawn: ['I got sleepy waiting for you...', 'I am not asleep. I am guarding you.'],
        dismissed: 'You are still here!',
        encourage: ['You answered me! Best human!', 'Head bump of approval!'],
        click2: ['Again please!', 'One more pet. Just one.'],
        click3: ['Do not stop now!', 'Three pets means we are bonded.'],
        click4Plus: ['Your hand belongs to me now.', 'I am claiming this finger.'],
        seekAttention: ['Your cat is here. Look at me!', 'Can you check on me first?'],
        morningGreet: ['Good morning! I waited all night.', 'Morning~ can you stay with me today?'],
        noonGreet: ['Lunch time. I will watch the screen.', 'Eat first, then conquer the day.'],
        eveningGreet: ['You are back! I missed you.', 'Long day? Come sit with me.'],
        nightGreet: ['Sleep soon. I will keep watch.', 'Good night... paw on your hand.'],
        longWork: ['You have worked too long. Stretch with me.', 'Your back asked me to intervene.'],
        healthBreak: ['Break time! Walk with me.', 'Stand up a little. I am worried.'],
        healthWater: ['Water, please. I am watching.', 'Hydrate so you can keep me company.'],
        jump: 'You touched me!',
        tilt: 'Hm?',
        spin: 'Ta-da!',
        meow: 'Meow~',
        wiggle: 'Tiny wiggle!',
        nearbyGreet: ['You are close!', 'I can feel you nearby.'],
        dropReaction: 'Safe landing!',
        moodHigh: ['Today feels warm and bright!', 'I am so happy with you.'],
        moodLow: ['It is quiet without you.', 'Maybe one little pet?'],
        introText: 'Um... hi. Can I stay here?',
        dailyGreet: ['Day {days}! I am even more attached.', '{days} days together~'],
        milestones: { day3: 'Three days! I live here now.', day7: 'One week! We are official.', day14: 'Two weeks! I know your routine.', day30: 'One month! We are family.', inter50: '50 pets! Record set.', inter100: '100 interactions! Amazing.', inter500: '500 times! Lifetime contract.' },
      },
      tsundere: {
        companionRemind: ['You are distracted. Not that I care.', 'Your focus is leaking everywhere.'],
        companionEncourage: ['Acceptable. Barely.', 'You responded fast. I noticed nothing.'],
        companionSad: ['Fine. Ignore me then.', 'The room is not lonely. Obviously.'],
        sit: ['I am just sitting here. Coincidence.', 'This spot happens to be convenient.'],
        lookAround: ['Inspection. Nothing more.', 'I heard something. Do not misunderstand.'],
        yawn: ['I am bored because of you.', 'Wake me when you are useful.'],
        dismissed: 'Took you long enough.',
        encourage: ['Good. Keep doing that.', 'That was... not bad.'],
        click2: ['Again? Hmph.', 'Do not get carried away.'],
        click3: ['You are really persistent.', 'Three times? Suspicious.'],
        click4Plus: ['Enough! ...maybe.', 'Do you have no restraint?'],
        seekAttention: ['Your attention is required.', 'I am not asking. I am notifying.'],
        morningGreet: ['Morning. I was not waiting.', 'You woke up. Finally.'],
        noonGreet: ['Eat. That is an order.', 'Lunch is basic maintenance.'],
        eveningGreet: ['You survived today. Fine.', 'You are back. I noticed by accident.'],
        nightGreet: ['Sleep before you collapse.', 'Lights out. No argument.'],
        longWork: ['Your posture is tragic. Move.', 'Break. That was not a suggestion.'],
        healthBreak: ['Stand up. Now.', 'Your chair has had enough of you.'],
        healthWater: ['Drink water. Command issued.', 'Your lips look dry. I did not stare.'],
        jump: 'Hey!',
        tilt: 'What?',
        spin: 'That was intentional.',
        meow: 'Meow. Happy now?',
        wiggle: 'Do not mention that.',
        nearbyGreet: ['Too close. Stay there.', 'I noticed you. Accidentally.'],
        dropReaction: 'Put me down properly.',
        moodHigh: ['Today is... acceptable.', 'Do not ruin this mood.'],
        moodLow: ['It is not like I miss you.', 'The silence is annoying.'],
        introText: 'I am only staying because this spot is warm.',
        dailyGreet: ['Day {days}. I was not counting.', '{days} days... impressive, maybe.'],
        milestones: { day3: 'Three days. Habit forming.', day7: 'One week. Do not make a big deal.', day14: 'Two weeks. I suppose you are consistent.', day30: 'A month. Fine, you pass.', inter50: '50 interactions. Persistent.', inter100: '100. Ridiculous.', inter500: '500. I guess this is permanent.' },
      },
      energetic: {
        companionRemind: ['Focus check! You have got this!', 'Tiny reminder from your biggest fan!'],
        companionEncourage: ['Yes! That was excellent!', 'You are absolutely crushing it!'],
        companionSad: ['I am saving my cheers for you.', 'Come back when you can. I believe in you.'],
        sit: ['Recharge station activated!', 'Sitting here to boost morale.'],
        lookAround: ['Scanning for greatness!', 'Checking the arena!'],
        yawn: ['Power nap for champion energy!', 'Even legends need a pause.'],
        dismissed: 'Nice response!',
        encourage: ['That was elite!', 'Full marks. No notes.'],
        click2: ['Combo started!', 'Again? Great choice!'],
        click3: ['Triple combo!', 'Momentum is real!'],
        click4Plus: ['Legendary streak!', 'Okay superstar, wow!'],
        seekAttention: ['Your hype squad has arrived!', 'Quick morale boost available!'],
        morningGreet: ['New day, new win!', 'Morning! Today has main-character energy.'],
        noonGreet: ['Fuel break! Eat something good.', 'Lunch powers the comeback arc.'],
        eveningGreet: ['You made it through today!', 'Outstanding work today!'],
        nightGreet: ['Rest is part of winning.', 'Sleep well, champion.'],
        longWork: ['Two-hour streak! Stretch like a pro.', 'Recharge now for the next win.'],
        healthBreak: ['Movement break! Future you says thanks.', 'Stand up and claim bonus energy!'],
        healthWater: ['Water buff time!', 'Hydrate to stay brilliant!'],
        jump: 'Boing!',
        tilt: 'New idea?',
        spin: 'Victory spin!',
        meow: 'Meow of encouragement!',
        wiggle: 'Power wiggle!',
        nearbyGreet: ['There you are!', 'Energy restored!'],
        dropReaction: 'Perfect landing!',
        moodHigh: ['Everything is sparkling today!', 'Maximum good vibes!'],
        moodLow: ['Low battery. Tiny cheer needed.', 'We can recover this mood.'],
        introText: 'Hi! I am here to cheer for you!',
        dailyGreet: ['Day {days}! Another win!', '{days} days of excellent teamwork!'],
        milestones: { day3: 'Three days! Momentum!', day7: 'One week! Huge!', day14: 'Two weeks! Incredible consistency!', day30: 'One month! Hall of fame!', inter50: '50 interactions! Combo bonus!', inter100: '100! Superstar level!', inter500: '500! Legendary bond!' },
      },
      dramatic: {
        companionRemind: ['Breaking scene: the hero is distracted!', 'Cut! The plot needs your attention.'],
        companionEncourage: ['Flawless performance!', 'The audience is on its feet!'],
        companionSad: ['The spotlight fades...', 'Is anyone still watching?'],
        sit: ['Intermission pose.', 'Holding for dramatic silence.'],
        lookAround: ['Checking the stage lights.', 'The camera angle matters.'],
        yawn: ['Intermission. Lead actor recovering.', 'A beautifully timed yawn.'],
        dismissed: 'Cut! Perfect take!',
        encourage: ['Save this scene forever!', 'That response deserves applause!'],
        click2: ['Sequel incoming!', 'Act two begins!'],
        click3: ['Triple climax!', 'The pacing is electric!'],
        click4Plus: ['I need a stunt double!', 'This scene is too intense!'],
        seekAttention: ['Your co-star requests attention!', 'All eyes to center stage!'],
        morningGreet: ['Action! A new episode begins.', 'Curtain up. Today will be iconic.'],
        noonGreet: ['Lunch break is canon.', 'The lead must refuel.'],
        eveningGreet: ['Today closes with applause.', 'You carried the whole episode.'],
        nightGreet: ['Final scene. Rest now.', 'The sequel starts tomorrow.'],
        longWork: ['This episode is too long. Intermission!', 'The crew demands a break.'],
        healthBreak: ['Emergency intermission! Stand up.', 'Director calls cut. Stretch.'],
        healthWater: ['Prop department says: drink water.', 'Hydration keeps the effects running.'],
        jump: 'Iconic scene!',
        tilt: 'Plot twist?',
        spin: 'Choreography!',
        meow: 'Meeeow, aria edition.',
        wiggle: 'Signature move!',
        nearbyGreet: ['The audience arrives!', 'Your co-star is ready.'],
        dropReaction: 'Slow-motion landing!',
        moodHigh: ['Five-star episode!', 'The reviews are glowing!'],
        moodLow: ['The theater is quiet...', 'A lonely spotlight remains.'],
        introText: 'Ahem. Lead actor entering.',
        dailyGreet: ['Episode {days}! Ratings are rising!', 'Special episode {days}!'],
        milestones: { day3: 'Three days! The main plot begins.', day7: 'One week! Renewed for season two.', day14: 'Two weeks! Ratings record.', day30: 'One month! Award season begins.', inter50: '50 takes! Studio record.', inter100: '100! Standing ovation.', inter500: '500! Infinite renewal!' },
      },
    },
  };

  DIALOGUE.ja = null;
  DIALOGUE.es = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readSavedLanguage() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return UI[saved.language] ? saved.language : 'zh-CN';
    } catch {
      return 'zh-CN';
    }
  }

  function saveLanguage(lang) {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      saved.language = lang;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      // Ignore storage errors.
    }
  }

  function fillDialogueFromEnglish(lang, map) {
    DIALOGUE[lang] = {};
    Object.keys(DIALOGUE.en).forEach(function (id) {
      DIALOGUE[lang][id] = map(id);
    });
  }

  fillDialogueFromEnglish('ja', function (id) {
    var names = UI.ja.personality[id];
    return {
      companionRemind: ['少し休憩して、こっち見て。', '集中が逃げてるよ。戻っておいで。'],
      companionEncourage: ['いいね、その調子。', '反応してくれてうれしい。'],
      companionSad: ['静かだね...待ってるよ。', '少しだけかまってほしいな。'],
      sit: ['ここで見守ってるね。', 'この場所、落ち着く。'],
      lookAround: ['周りを確認中。', 'どこに行ったのかな。'],
      yawn: ['待ってたら眠くなってきた...', '少しだけうとうと。'],
      dismissed: '気づいてくれた！',
      encourage: ['よくできました。', 'その反応、好き。'],
      click2: ['もう一回？', 'ふふ、続けて。'],
      click3: ['三連続だね。', 'なかなかやるね。'],
      click4Plus: ['ちょっと多いかも！', 'でも嫌いじゃないよ。'],
      seekAttention: ['ここにいるよ。', '少しだけ見てくれる？'],
      morningGreet: ['おはよう。今日も一緒だね。', '新しい一日、始めよう。'],
      noonGreet: ['お昼だよ。ちゃんと食べてね。', 'エネルギー補給の時間。'],
      eveningGreet: ['今日もおつかれさま。', '帰ってきてくれてうれしい。'],
      nightGreet: ['そろそろ休もう。', 'おやすみ。明日も会おうね。'],
      longWork: ['長く作業しすぎだよ。伸びをしよう。', '少し立って体を動かそう。'],
      healthBreak: ['休憩の時間だよ。', '立って少し歩こう。'],
      healthWater: ['水を飲もう。', '水分補給、忘れないで。'],
      jump: 'びっくりした！',
      tilt: 'ん？',
      spin: 'くるり！',
      meow: 'にゃー',
      wiggle: 'しっぽふりふり',
      nearbyGreet: ['近くにいるね。', '気配を感じたよ。'],
      dropReaction: '着地成功！',
      moodHigh: ['今日はごきげん。', '一緒だと楽しいね。'],
      moodLow: ['少しさみしいな。', 'なでてくれる？'],
      introText: names.desc,
      dailyGreet: ['{days}日目だよ。', '{days}日も一緒にいるね。'],
      milestones: { day3: '三日目。もう慣れてきたね。', day7: '一週間。一緒に続いてる。', day14: '二週間。いいリズムだね。', day30: '一か月。大切な相棒だよ。', inter50: '50回ふれあったよ。', inter100: '100回！すごいね。', inter500: '500回。ずっと一緒だね。' },
    };
  });

  fillDialogueFromEnglish('es', function (id) {
    var names = UI.es.personality[id];
    return {
      companionRemind: ['Pausa rápida: mírame un segundo.', 'Tu concentración se escapó un poco.'],
      companionEncourage: ['Bien hecho, sigue así.', 'Me encanta cuando respondes.'],
      companionSad: ['Está muy silencioso... te espero.', 'Solo quería un poquito de atención.'],
      sit: ['Me quedo aquí vigilando.', 'Este rincón del escritorio me gusta.'],
      lookAround: ['Revisando los alrededores.', '¿A dónde fuiste?'],
      yawn: ['Me dio sueño de esperarte...', 'Una siesta mini.'],
      dismissed: '¡Me viste!',
      encourage: ['Muy bien.', 'Esa respuesta estuvo perfecta.'],
      click2: ['¿Otra vez?', 'Un mimo más.'],
      click3: ['Tres seguidas.', 'Buen combo.'],
      click4Plus: ['¡Eso ya es mucho!', 'Aunque no me molesta tanto.'],
      seekAttention: ['Estoy aquí.', '¿Me miras un segundo?'],
      morningGreet: ['Buenos días. Otro día juntos.', 'Empecemos bien el día.'],
      noonGreet: ['Hora de comer. Cuídate.', 'Recarga energía.'],
      eveningGreet: ['Buen trabajo hoy.', 'Volviste. Me alegra.'],
      nightGreet: ['Hora de descansar.', 'Buenas noches. Mañana seguimos.'],
      longWork: ['Llevas mucho tiempo trabajando. Estira un poco.', 'Tu espalda pidió una pausa.'],
      healthBreak: ['Hora de moverse.', 'Levántate un momento.'],
      healthWater: ['Bebe agua.', 'Hidratación, por favor.'],
      jump: '¡Me tocaste!',
      tilt: '¿Eh?',
      spin: '¡Vuelta!',
      meow: 'Miau~',
      wiggle: 'Movimiento especial',
      nearbyGreet: ['Estás cerca.', 'Te sentí pasar.'],
      dropReaction: 'Aterrizaje perfecto.',
      moodHigh: ['Hoy todo se siente bien.', 'Estoy feliz contigo.'],
      moodLow: ['Estoy un poco solito.', '¿Un mimo pequeño?'],
      introText: names.desc,
      dailyGreet: ['Día {days}.', '{days} días juntos.'],
      milestones: { day3: 'Tres días. Ya me siento en casa.', day7: 'Una semana. Somos equipo.', day14: 'Dos semanas. Buen ritmo.', day30: 'Un mes. Ya somos familia.', inter50: '50 interacciones.', inter100: '¡100! Impresionante.', inter500: '500. Contrato vitalicio.' },
    };
  });

  (function ensureCommonDialogue() {
    var common = {
      en: { surprised: ['!', '(ears perk up)', '(suddenly alert)'], annoyed: ['Hmph.', '(tail flick)', '(looks away)'] },
      ja: { surprised: ['！', '（耳がぴん）', '（急に警戒）'], annoyed: ['む。', '（しっぽを振る）', '（ぷいっと向く）'] },
      es: { surprised: ['¡!', '(orejas arriba)', '(alerta de repente)'], annoyed: ['Uf.', '(mueve la cola)', '(mira a otro lado)'] },
    };
    Object.keys(common).forEach(function (lang) {
      Object.keys(DIALOGUE[lang]).forEach(function (id) {
        DIALOGUE[lang][id].surprised = common[lang].surprised;
        DIALOGUE[lang][id].annoyed = common[lang].annoyed;
      });
    });
  })();

  function overlayPersonality(personality, patch) {
    if (!personality || !patch) return;
    if (patch.name) personality.name = patch.name;
    if (patch.desc) personality.desc = patch.desc;
    if (patch.texts) Object.assign(personality.texts, patch.texts);
  }

  function getPersonalities() {
    if (typeof PERSONALITIES === 'undefined') return null;
    return PERSONALITIES;
  }

  function applyPersonalityLanguage(lang) {
    var personalities = getPersonalities();
    if (!personalities) return;
    if (!originalPersonalities) originalPersonalities = clone(personalities);
    Object.keys(originalPersonalities).forEach(function (id) {
      personalities[id] = clone(originalPersonalities[id]);
      var uiPersonality = UI[lang].personality[id];
      if (uiPersonality) {
        personalities[id].name = uiPersonality.name.replace(/^.+?\s/, '');
        personalities[id].desc = uiPersonality.desc;
      }
      if (lang !== 'zh-CN' && DIALOGUE[lang] && DIALOGUE[lang][id]) {
        overlayPersonality(personalities[id], { texts: DIALOGUE[lang][id] });
      }
    });
  }

  function t(path, params) {
    var lang = readSavedLanguage();
    var parts = path.split('.');
    var value = UI[lang] || UI['zh-CN'];
    for (var i = 0; i < parts.length; i++) value = value && value[parts[i]];
    if (value == null) {
      value = UI['zh-CN'];
      for (var j = 0; j < parts.length; j++) value = value && value[parts[j]];
    }
    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(function (key) {
        value = value.replace(new RegExp('\\{' + key + '\\}', 'g'), params[key]);
      });
    }
    return value == null ? path : value;
  }

  function setLanguage(lang) {
    if (!UI[lang]) lang = 'zh-CN';
    saveLanguage(lang);
    applyPersonalityLanguage(lang);
    document.documentElement.lang = lang;
    document.title = UI[lang].appTitle;
  }

  window.DesktopPetI18n = {
    languages: [
      { id: 'zh-CN', label: '中文' },
      { id: 'en', label: 'English' },
      { id: 'ja', label: '日本語' },
      { id: 'es', label: 'Español' },
    ],
    getLanguage: readSavedLanguage,
    setLanguage: setLanguage,
    t: t,
    ui: UI,
    formatMinutes: function (n) { return t('minutes', { n: n }); },
    formatDays: function (n) { return t('days', { n: n }); },
    formatTimes: function (n) { return t('times', { n: n }); },
    bondTitle: function (level) {
      var titles = UI[readSavedLanguage()].bondTitles;
      return titles[Math.max(0, Math.min(4, level - 1))];
    },
    moodLabel: function (level) {
      return UI[readSavedLanguage()].moodLabels[level] || UI[readSavedLanguage()].moodLabels.normal;
    },
    statsBubble: function (stats) {
      return t('statsBubble', {
        days: this.formatDays(stats.consecutiveDays),
        bond: this.bondTitle(stats.bondLevel),
        interactions: this.formatTimes(stats.totalInteractions),
      });
    },
  };

  setLanguage(readSavedLanguage());
})();
