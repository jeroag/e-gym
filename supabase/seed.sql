-- ============================================================
-- E-GYM · Seed de ejercicios globales
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql
-- Es idempotente (puedes ejecutarlo varias veces sin duplicar nada).
-- ============================================================

INSERT INTO exercises (trainer_id, name, description, muscle_group) VALUES
  -- Pecho
  (NULL, 'Press banca con barra',     'Tumbado en banco plano, baja la barra hasta el pecho y empuja.',          'chest'),
  (NULL, 'Press inclinado mancuernas','Banco inclinado 30-45°, empuja las mancuernas hasta arriba.',             'chest'),
  (NULL, 'Aperturas con mancuerna',   'En banco plano, abre los brazos en arco manteniendo codos semiflexionados.','chest'),
  (NULL, 'Fondos en paralelas',       'Sostén el cuerpo entre dos barras y baja flexionando codos.',             'chest'),
  (NULL, 'Press con mancuernas',      'Press en banco plano con mancuernas, mayor rango que con barra.',         'chest'),

  -- Espalda
  (NULL, 'Dominadas',                 'Tracción vertical desde barra hasta llevar mentón por encima.',           'back'),
  (NULL, 'Remo con barra',            'Tronco inclinado, tira de la barra hacia el abdomen bajo.',               'back'),
  (NULL, 'Jalón al pecho',            'En polea alta, tira de la barra hacia las clavículas con torso firme.',   'back'),
  (NULL, 'Peso muerto',               'Levanta la barra del suelo hasta cadera manteniendo espalda neutra.',     'back'),
  (NULL, 'Remo con mancuerna',        'Una rodilla en banco, rema la mancuerna hacia la cadera.',                'back'),
  (NULL, 'Pull-over',                 'Tumbado, lleva la mancuerna desde detrás de la cabeza hasta el pecho.',   'back'),

  -- Pierna
  (NULL, 'Sentadilla con barra',      'Barra sobre trapecios, baja hasta que muslos queden paralelos al suelo.', 'legs'),
  (NULL, 'Prensa de piernas',         'Empuja la plataforma desde 90° hasta extensión casi completa.',           'legs'),
  (NULL, 'Hip thrust',                'Apoya escápulas en banco, empuja cadera con barra apoyada en pelvis.',    'legs'),
  (NULL, 'Zancadas',                  'Da un paso largo y baja la rodilla trasera hasta casi tocar el suelo.',   'legs'),
  (NULL, 'Curl femoral tumbado',      'En máquina, flexiona rodillas para acercar talones a glúteos.',           'legs'),
  (NULL, 'Extensión de cuádriceps',   'En máquina sentado, extiende las rodillas contra la resistencia.',        'legs'),
  (NULL, 'Sentadilla búlgara',        'Pie trasero elevado, sentadilla unilateral con la pierna delantera.',     'legs'),

  -- Hombros
  (NULL, 'Press militar',             'De pie, empuja la barra desde clavículas hasta extensión total.',         'shoulders'),
  (NULL, 'Elevaciones laterales',     'Sube las mancuernas a los lados hasta altura de hombro.',                 'shoulders'),
  (NULL, 'Pájaros',                   'Inclinado, abre los brazos a los lados para trabajar deltoides posterior.','shoulders'),
  (NULL, 'Press Arnold',              'Press con rotación: empieza palmas hacia ti, termina mirando al frente.', 'shoulders'),
  (NULL, 'Encogimientos',             'De pie con mancuernas o barra, eleva los hombros hacia las orejas.',      'shoulders'),

  -- Brazos
  (NULL, 'Curl con barra',            'Codos pegados al cuerpo, flexiona los brazos hasta el pecho.',            'arms'),
  (NULL, 'Curl con mancuernas',       'Curl unilateral o alternado, mejor control y rango.',                     'arms'),
  (NULL, 'Curl martillo',             'Mancuernas con agarre neutro (palmas enfrentadas) para braquial.',        'arms'),
  (NULL, 'Press francés',             'Tumbado, baja la barra controlando hasta la frente y extiende.',          'arms'),
  (NULL, 'Extensiones polea',         'En polea alta con cuerda o barra, extiende codos hacia abajo.',           'arms'),
  (NULL, 'Fondos en banco',           'Manos en banco detrás, baja flexionando codos.',                          'arms'),

  -- Core
  (NULL, 'Plancha frontal',           'Mantén postura recta sobre antebrazos y puntas de los pies.',             'core'),
  (NULL, 'Crunch abdominal',          'Tumbado boca arriba, eleva el tronco contrayendo abdomen.',               'core'),
  (NULL, 'Russian twist',             'Sentado, gira el torso de lado a lado con un peso entre las manos.',      'core'),
  (NULL, 'Mountain climbers',         'En plancha alta, lleva rodillas al pecho alternándolas con ritmo.',       'core'),
  (NULL, 'Elevaciones de piernas',    'Colgado o tumbado, eleva piernas hasta 90° controlando descenso.',        'core'),
  (NULL, 'Plancha lateral',           'Apoyado en un antebrazo y un pie, mantén cuerpo alineado.',               'core'),

  -- Cardio
  (NULL, 'Cinta de correr',           'Carrera continua o por intervalos según objetivo.',                       'cardio'),
  (NULL, 'Bicicleta estática',        'Bicicleta a ritmo constante o HIIT.',                                     'cardio'),
  (NULL, 'Elíptica',                  'Movimiento de bajo impacto que trabaja tren superior e inferior.',        'cardio'),
  (NULL, 'Burpees',                   'Sentadilla, plancha, flexión, salto. Ejercicio completo de alta intensidad.','cardio'),
  (NULL, 'Saltos a cajón',            'Salto explosivo subiendo a un cajón o plataforma.',                       'cardio'),
  (NULL, 'Remo en máquina',           'Remo en máquina ergómetro, full-body de bajo impacto.',                   'cardio')
ON CONFLICT DO NOTHING;
