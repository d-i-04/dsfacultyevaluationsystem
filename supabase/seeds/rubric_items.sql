-- Seed rubric items mapped by label; ensure rubric_categories already seeded.
with cat as (
  select id, label from rubric_categories where label in (
    'Commitment',
    'Knowledge of Subject',
    'Teaching for Independent Learning',
    'Management of Learning'
  )
)
insert into rubric_items (category_id, prompt, order_index)
values
  ((select id from cat where label = 'Commitment'), 'Demonstrates sensitivity to students ability to attend and absorb content information.', 1),
  ((select id from cat where label = 'Commitment'), 'Integrates sensitively learning objectives with those of the students in a collaborative process.', 2),
  ((select id from cat where label = 'Commitment'), 'Makes self-available to students beyond official time.', 3),
  ((select id from cat where label = 'Commitment'), 'Regularly comes to class on time, well-groomed and well-prepared to complete assigned responsibilities.', 4),
  ((select id from cat where label = 'Commitment'), 'Keeps accurate records of students performance and prompt submission of the same.', 5),

  ((select id from cat where label = 'Knowledge of Subject'), 'Demonstrates mastery of the subject matter (explain the subject matter without relying solely on the prescribed textbook).', 1),
  ((select id from cat where label = 'Knowledge of Subject'), 'Draws and share information on the state of the art of theory and practice in his/her discipline.', 2),
  ((select id from cat where label = 'Knowledge of Subject'), 'Integrates subject to practical circumstances and learning intents/purposes of the students.', 3),
  ((select id from cat where label = 'Knowledge of Subject'), 'Explains the relevance of present topics to the previous lessons, and relates the subject matter to relevant correct issues and/or daily life activities.', 4),
  ((select id from cat where label = 'Knowledge of Subject'), 'Demonstrates up-to-date knowledge and/or awareness on current trends and issues of the subject.', 5),

  ((select id from cat where label = 'Teaching for Independent Learning'), 'Creates teaching strategies that allow students to practice using concepts they need to understand.', 1),
  ((select id from cat where label = 'Teaching for Independent Learning'), 'Enhances student self-esteem and/or gives due recognition to students performance/potentials.', 2),
  ((select id from cat where label = 'Teaching for Independent Learning'), 'Allows students to create their own course with objectives and realistically defined student-professor rules and make them accountable for their performance.', 3),
  ((select id from cat where label = 'Teaching for Independent Learning'), 'Allows students to think independently and make their own decisions and holding them accountable for their performance based largely on their success in executing decisions.', 4),
  ((select id from cat where label = 'Teaching for Independent Learning'), 'Encourages students to learn beyond what is required and help/guide the students how to apply the concepts learned.', 5),

  ((select id from cat where label = 'Management of Learning'), 'Creates opportunities for intensive and/or extensive contribution of students in the class activities (e.g. breaks class into dyads, triads or buzz/task groups).', 1),
  ((select id from cat where label = 'Management of Learning'), 'Assumes roles as facilitator, resource person, coach, inquisitor, integrator, referee in drawing students to contribute to knowledge and understanding of the concepts at hand.', 2),
  ((select id from cat where label = 'Management of Learning'), 'Designs and implements learning conditions and experience that promote healthy exchange and/or confrontations.', 3),
  ((select id from cat where label = 'Management of Learning'), 'Structures/re-structures learning and teaching-learning context to enhance attainment of collective learning objectives.', 4),
  ((select id from cat where label = 'Management of Learning'), 'Use of Instructional Materials (audio/video materials, fieldtrips, film showing, computer aided instruction and etc.) to reinforce learning processes.', 5)
;
