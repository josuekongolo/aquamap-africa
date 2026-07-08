// DACMS — FAO good practices & indicators for aquaculture co-management systems.
// Transcribed from the official assessment sheet:
//   FAO. 2024. "Guidebook for developing aquaculture co-management systems —
//   Annex 1. Example assessment sheet for the evaluation of the design and
//   performance of the aquaculture co-management system." Project
//   GCP/GLO/1049/ROK. https://doi.org/10.4060/cd0722en
//   (itself based on Pomeroy et al., 2022). Guidebook: doi 10.4060/cd1410en.
// French wording is our translation of the FAO English original.
// Note: the source sheet repeats "regular meetings between government and
// resource users" under both 1.2.A.4 and 1.2.A.5; it is scored once here
// (I.2.A.4.2) to avoid double counting. Source typo 1.2.D.2.2 (duplicated id)
// is normalized to I.2.D.1.2.

export const DACMS_SOURCE = {
  label: 'FAO — DACMS Annex 1 (GCP/GLO/1049/ROK)',
  citation: 'FAO. 2024. Guidebook for developing aquaculture co-management systems, Annex 1.',
  url: 'https://doi.org/10.4060/cd0722en',
};

// Scoring scale used by the FAO sheet: Yes / Partly / No / Not applicable.
export const DACMS_SCORES = [
  { id: 'yes',    color: '#00A878' },
  { id: 'partly', color: '#F4A261' },
  { id: 'no',     color: '#dc2626' },
  { id: 'na',     color: '#94a3b8' },
];

export const dacmsSections = [
  {
    id: 'I.1',
    title: {
      fr: 'Environnement favorable et ancrage institutionnel (pratiques externes)',
      en: 'Enabling environment and institutional fit (external good practices)',
    },
    practices: [
      {
        id: 'I.1.1',
        title: { fr: 'Fixer une échelle appropriée', en: 'Set appropriate scale' },
        indicators: [
          { id: 'I.1.1.1', text: {
            fr: "L'échelle et la zone du système cogéré ont été convenues par un processus participatif avec les parties prenantes concernées.",
            en: 'The scale and area of the co-managed aquaculture system have been agreed through a participatory process with concerned stakeholders.' } },
        ],
      },
      {
        id: 'I.1.2',
        title: { fr: 'Définir les limites', en: 'Define boundaries' },
        indicators: [
          { id: 'I.1.2.1', text: {
            fr: 'Les limites du système cogéré sont démarquées (zone spatiale, cartes SIG endossées) ou clairement décrites dans l’accord de cogestion.',
            en: 'Boundaries of the co-managed system have been demarcated (spatially, with endorsed GIS-based maps) or otherwise clearly described in a co-management agreement.' } },
        ],
      },
      {
        id: 'I.1.3',
        title: { fr: 'Identifier le niveau de soutien à la cogestion', en: 'Identify level of support for ACM' },
        indicators: [
          { id: 'I.1.3.1', text: {
            fr: 'Des dispositions légales permettent aux usagers de s’organiser et d’enregistrer des organisations formelles.',
            en: 'There are legal provisions for resource users to organize and register formal organizations.' } },
          { id: 'I.1.3.2', text: {
            fr: 'Les responsabilités de cogestion ont été formellement déléguées au comité de cogestion.',
            en: 'Co-management responsibilities have been formally delegated to the co-management committee.' } },
        ],
      },
      {
        id: 'I.1.4',
        title: { fr: 'Établir les mandats et responsabilités', en: 'Establish mandates and responsibilities' },
        indicators: [
          { id: 'I.1.4.1', text: {
            fr: 'Les lois et règlements existants délimitent le mandat et les responsabilités du gouvernement, des pisciculteurs et des autres acteurs privés participant à la cogestion.',
            en: 'Existing laws and regulations delineate the mandate and responsibilities of government, farmers and other private sector actors seeking to participate in ACM.' } },
          { id: 'I.1.4.2', text: {
            fr: 'Les participants (potentiels) sont sensibilisés à ces mandats et responsabilités.',
            en: 'Awareness of mandates and responsibilities is raised among (potential) participants.' } },
        ],
      },
      {
        id: 'I.1.5',
        title: { fr: 'Délimiter les droits fonciers des producteurs', en: 'Delineate tenure rights of aquaculture producers' },
        indicators: [
          { id: 'I.1.5.1', text: {
            fr: 'Les droits fonciers et d’accès sont attribués équitablement, de manière transparente et responsable.',
            en: 'Tenure and access rights are deemed and equitably allocated in a transparent and accountable manner.' } },
          { id: 'I.1.5.2', text: {
            fr: 'Les droits fonciers et d’accès sont adéquatement intégrés dans l’accord de cogestion.',
            en: 'Tenure and access rights have been adequately integrated/reflected in the ACM agreement.' } },
          { id: 'I.1.5.3', text: {
            fr: 'Toutes les parties prenantes ont accès à l’information sur les droits fonciers et les critères et processus d’allocation des ressources.',
            en: 'All stakeholders have access to information on the tenure rights and resource allocation criteria and processes.' } },
        ],
      },
      {
        id: 'I.1.6',
        title: { fr: 'Mobiliser le soutien du gouvernement et des élites', en: 'Engage support of government and political/economic elites' },
        indicators: [
          { id: 'I.1.6.1', text: {
            fr: 'Le gouvernement soutient la cogestion et y participe conformément à l’accord conclu avec les usagers.',
            en: 'The government supports and participates in co-management according to agreement with resource users on cooperation.' } },
          { id: 'I.1.6.2', text: {
            fr: 'La prise de décision est partagée entre échelles et entre parties prenantes diverses ayant un intérêt dans la ressource cogérée.',
            en: 'Decision-making is shared across scales and between diverse stakeholders with an interest in the resource being co-managed.' } },
        ],
      },
      {
        id: 'I.1.7',
        title: { fr: 'Faire respecter les règles de gestion', en: 'Enforce management rules' },
        indicators: [
          { id: 'I.1.7.1', text: {
            fr: 'Un système d’auto-application des sanctions est conçu par les usagers/participants à la cogestion.',
            en: 'Self-enforcement system of penalties is designed by resource users/co-management participants.' } },
          { id: 'I.1.7.2', text: {
            fr: 'Un mécanisme d’application actif est en place et opérationnel.',
            en: 'There is an active enforcement mechanism in place and operational.' } },
        ],
      },
      {
        id: 'I.1.8',
        title: { fr: 'Établir des sanctions graduées', en: 'Establish and enforce graduated sanctions' },
        indicators: [
          { id: 'I.1.8.1', text: {
            fr: 'Les sanctions sont proportionnelles au nombre ou à la gravité des infractions.',
            en: 'Sanctions are proportional to the number or severity of offences.' } },
        ],
      },
    ],
  },
  {
    id: 'I.2.A',
    title: {
      fr: 'Participation, transparence et équité (pratiques internes)',
      en: 'Participation, transparency and equity (internal good practices)',
    },
    practices: [
      {
        id: 'I.2.A.1',
        title: { fr: 'Permettre la participation des parties affectées', en: 'Enable participation by affected parties' },
        indicators: [
          { id: 'I.2.A.1.1', text: {
            fr: 'Les parties prenantes affectées par les décisions de cogestion sont incluses dans le comité de cogestion.',
            en: 'Stakeholders affected by co-management arrangements and decisions are included in the co-management committee.' } },
          { id: 'I.2.A.1.2', text: {
            fr: 'Les participants et membres du comité reçoivent l’information à l’avance, avant la prise de décision.',
            en: 'Co-management participants and committee members receive advance information before decision-making.' } },
        ],
      },
      {
        id: 'I.2.A.2',
        title: { fr: 'Favoriser la cohésion sociale', en: 'Foster social cohesion' },
        indicators: [
          { id: 'I.2.A.2.1', text: {
            fr: 'Les participants à la cogestion se font confiance.',
            en: 'Co-management participants trust each other.' } },
          { id: 'I.2.A.2.2', text: {
            fr: 'Les membres du comité sont représentatifs (ethnie, religion, etc.) des usagers/participants.',
            en: 'The co-management committee members are representative of the ethnicity, religion, etc. of the resource users/participants.' } },
          { id: 'I.2.A.2.3', text: {
            fr: 'Les membres du système de cogestion travaillent bien et décident ensemble.',
            en: 'Members of the co-management system work well and make decisions together.' } },
        ],
      },
      {
        id: 'I.2.A.3',
        title: { fr: 'Développer les capacités des participants', en: 'Enable participant capacity development' },
        indicators: [
          { id: 'I.2.A.3.1', text: {
            fr: 'Des programmes actifs de développement des compétences renforcent la capacité des pisciculteurs à participer aux activités de cogestion au niveau communautaire.',
            en: 'There are active skills development programmes for enhancing capacity building for aquaculture farmers to participate in co-management activities at community level.' } },
          { id: 'I.2.A.3.2', text: {
            fr: 'Les participants ont une compréhension de base de l’objet et du fonctionnement du système de cogestion.',
            en: 'There is a basic understanding among participants about the purpose and operation of the co-management system.' } },
        ],
      },
      {
        id: 'I.2.A.4',
        title: { fr: 'Établir une information transparente', en: 'Establish transparent information' },
        indicators: [
          { id: 'I.2.A.4.1', text: {
            fr: 'L’information sur la coordination et la coopération entre gouvernement et usagers est disponible.',
            en: 'Information is available on the coordination and cooperation of government and resource users.' } },
          { id: 'I.2.A.4.2', text: {
            fr: 'Des réunions régulières ont lieu entre le gouvernement et les usagers.',
            en: 'There are regular meetings between government and resource users.' } },
        ],
      },
      {
        id: 'I.2.A.5',
        title: { fr: 'Établir une prise de décision transparente', en: 'Establish transparent decision-making' },
        indicators: [
          { id: 'I.2.A.5.1', text: {
            fr: 'Les règles et calendriers de décision sont accessibles à tous les participants, qui peuvent consulter les décisions prises sur la gestion des ressources et risques partagés.',
            en: 'The organization of decision-making, including rules and timelines, is made available to all participants so that they can access decisions made on the management of shared resources and risks.' } },
        ],
      },
      {
        id: 'I.2.A.6',
        title: { fr: 'Assurer une représentation légitime', en: 'Ensure legitimate representation of the ACM arrangement' },
        indicators: [
          { id: 'I.2.A.6.1', text: {
            fr: 'Une organisation légitime (reconnue par la population locale) représente les usagers et parties prenantes dans la prise de décision.',
            en: 'A legitimate organization (as recognized by the local people) representing resource users and other stakeholders in decision-making is in place.' } },
        ],
      },
      {
        id: 'I.2.A.7',
        title: { fr: 'Assurer des coûts et bénéfices équitables', en: 'Ensure equitable costs and benefits' },
        indicators: [
          { id: 'I.2.A.7.1', text: {
            fr: 'Les différents groupes d’usagers ont des chances égales de participer au système de cogestion et d’en bénéficier.',
            en: 'Different resource user groups have equal opportunities to participate in and benefit from the co-management system.' } },
          { id: 'I.2.A.7.2', text: {
            fr: 'Les groupes légitimes d’usagers — y compris les jeunes, les femmes et les peuples autochtones — sont reconnus comme parties prenantes et ont des chances égales de participer.',
            en: 'Different legitimate resource user groups, including youth, women and Indigenous Peoples, are recognized as stakeholders and have equal opportunities to participate in the co-management arrangement.' } },
        ],
      },
    ],
  },
  {
    id: 'I.2.B',
    title: {
      fr: 'Leadership, règles et résolution des conflits',
      en: 'Leadership, rules and conflict resolution',
    },
    practices: [
      {
        id: 'I.2.B.1',
        title: { fr: 'Établir un accord de cogestion', en: 'Establish a co-management agreement' },
        indicators: [
          { id: 'I.2.B.1.1', text: {
            fr: 'Un accord formule la raison d’être, les objectifs et les règles communes (leadership, adhésion, conformité, résolution des conflits) et les conditions de redevabilité en cas de non-conformité.',
            en: 'An agreement formulates a rationale, set of goals and joint rules for participants (leadership, membership, rule compliance and conflict resolution) and conditions for holding participants accountable for non-compliance.' } },
        ],
      },
      {
        id: 'I.2.B.2',
        title: { fr: 'Assurer un leadership légitime', en: 'Ensure legitimate leadership' },
        indicators: [
          { id: 'I.2.B.2.1', text: {
            fr: 'Un leader local qualifié, doté de compétences entrepreneuriales, est élu par la population locale pour conduire les activités de cogestion.',
            en: 'A qualified local leader with entrepreneurial skills is elected by local people to lead overall co-management activities.' } },
          { id: 'I.2.B.2.2', text: {
            fr: 'Ce leader travaille efficacement avec les usagers/groupes d’usagers pour une aquaculture durable et les moyens de subsistance communautaires.',
            en: 'A qualified local leader is properly working with resource users/user groups for sustainable aquaculture and community livelihoods.' } },
        ],
      },
      {
        id: 'I.2.B.3',
        title: { fr: 'Définir l’adhésion, les droits et responsabilités', en: 'Define membership and rights and responsibilities' },
        indicators: [
          { id: 'I.2.B.3.1', text: {
            fr: 'Les règles pour les participants sont définies dans l’accord de cogestion.',
            en: 'Rules for participants are defined in the ACM agreement.' } },
          { id: 'I.2.B.3.2', text: {
            fr: 'Les droits et responsabilités relatifs aux décisions d’accès et d’usage des ressources et intrants partagés sont explicites.',
            en: 'Rights and responsibilities for decision-making over access and/or use of shared resources and inputs are made explicit.' } },
        ],
      },
      {
        id: 'I.2.B.4',
        title: { fr: 'Permettre et évaluer la conformité aux règles', en: 'Enable and assess rule compliance' },
        indicators: [
          { id: 'I.2.B.4.1', text: {
            fr: 'Le leadership peut aligner la conformité aux règles sur la législation publique et/ou les codes et normes privés.',
            en: 'The leadership of the ACM arrangement can align rule compliance with both public legislation and/or private codes and standards.' } },
          { id: 'I.2.B.4.2', text: {
            fr: 'Une évaluation de la conformité est en place (procédures internes ou codes et normes publics/privés).',
            en: 'Compliance assessment is in place, either drawing on internal procedures or state and/or private codes and standards.' } },
        ],
      },
      {
        id: 'I.2.B.5',
        title: { fr: 'Établir des mécanismes de gestion des conflits', en: 'Establish conflict management mechanisms' },
        indicators: [
          { id: 'I.2.B.5.1', text: {
            fr: 'Un mécanisme de gestion des conflits est en place, fonctionnel et documenté.',
            en: 'Conflict management mechanism is in place, functional and documented.' } },
          { id: 'I.2.B.5.2', text: {
            fr: 'Les conflits entre groupes d’usagers/parties prenantes sont résolus de manière durable.',
            en: 'Conflicts between different resource user groups/stakeholders are resolved in a sustainable manner.' } },
        ],
      },
      {
        id: 'I.2.B.6',
        title: { fr: 'Favoriser la redevabilité', en: 'Foster accountability' },
        indicators: [
          { id: 'I.2.B.6.1', text: {
            fr: 'Les décisions et le leadership sont transparents et documentés dans des procès-verbaux accessibles à tous les participants.',
            en: 'Decision-making and leadership of the co-management system are transparent and documented in committee meeting minutes available to all participants.' } },
          { id: 'I.2.B.6.2', text: {
            fr: 'Un comité de gestion démocratiquement élu représente les usagers/groupes d’usagers.',
            en: 'There is a democratically elected management committee representing resource users/user groups.' } },
        ],
      },
    ],
  },
  {
    id: 'I.2.C',
    title: {
      fr: 'Définition des objectifs, apprentissage et adaptation',
      en: 'Goal setting, learning and adaptation',
    },
    practices: [
      {
        id: 'I.2.C.1',
        title: { fr: 'Établir un plan de cogestion', en: 'Establish a co-management plan' },
        indicators: [
          { id: 'I.2.C.1.1', text: {
            fr: 'Un plan de cogestion existe et contient des dispositions clés et des buts et objectifs clairs.',
            en: 'There is a co-management plan and it contains key provisions and clear goals and objectives.' } },
          { id: 'I.2.C.1.2', text: {
            fr: 'Le plan a été élaboré avec une participation adéquate des différentes parties prenantes.',
            en: 'The co-management plan has been developed with the adequate participation of different stakeholders.' } },
          { id: 'I.2.C.1.3', text: {
            fr: 'Le plan a été traduit dans les langues locales des parties prenantes.',
            en: "The co-management plan has been translated into the stakeholders' native languages." } },
          { id: 'I.2.C.1.4', text: {
            fr: 'Le plan répond aux besoins d’équité de genre et reflète la diversité des perspectives de la communauté.',
            en: 'The co-management plan adequately addresses gender equity needs and reflects the diversity of perspectives in community/society.' } },
        ],
      },
      {
        id: 'I.2.C.2',
        title: { fr: 'Fixer des buts et objectifs clairs', en: 'Set clear goals and objectives based on collectively recognized issues' },
        indicators: [
          { id: 'I.2.C.2.1', text: {
            fr: 'Des buts/objectifs clairs, simples (SMART) et des indicateurs sont définis dans le plan de cogestion.',
            en: 'Clear and simple (SMART) goals/objectives and indicators are defined in the co-management plan.' } },
        ],
      },
      {
        id: 'I.2.C.3',
        title: { fr: 'Permettre une interaction et coordination régulières', en: 'Enable regular interaction and coordination' },
        indicators: [
          { id: 'I.2.C.3.1', text: {
            fr: 'Des réunions régulières, actives et participatives des participants à la cogestion ont lieu.',
            en: 'Regular, active and participatory meetings of co-management participants are held.' } },
          { id: 'I.2.C.3.2', text: {
            fr: 'Hommes et femmes sont représentés aux réunions et y participent activement.',
            en: 'There is representation of men and women at meetings and active participation by both men and women.' } },
        ],
      },
      {
        id: 'I.2.C.4',
        title: { fr: 'Renforcer les connaissances techniques', en: 'Enhance technical knowledge' },
        indicators: [
          { id: 'I.2.C.4.1', text: {
            fr: 'Les parties prenantes ont une bonne connaissance des techniques d’élevage.',
            en: 'Stakeholders have a good knowledge of farming techniques.' } },
        ],
      },
      {
        id: 'I.2.C.5',
        title: { fr: 'Établir un système durable de suivi-évaluation', en: 'Establish durable monitoring and evaluation system' },
        indicators: [
          { id: 'I.2.C.5.1', text: {
            fr: 'Un suivi-évaluation continu est mené de manière participative.',
            en: 'Continued monitoring and evaluation are conducted in a participatory way.' } },
          { id: 'I.2.C.5.2', text: {
            fr: 'Des indicateurs, cibles et valeurs de référence sont définis dans un plan de suivi-évaluation au sein du plan de cogestion.',
            en: 'Indicators, targets and baselines are defined in a monitoring and evaluation plan in the co-management plan.' } },
          { id: 'I.2.C.5.3', text: {
            fr: 'Le comité de cogestion opère des changements/adaptations sur la base de l’analyse des résultats du suivi-évaluation.',
            en: 'Changes/adaptations are made by the co-management committee based on analysis of available monitoring and evaluation results.' } },
        ],
      },
      {
        id: 'I.2.C.6',
        title: { fr: 'Permettre une gestion adaptative', en: 'Enable adaptive management' },
        indicators: [
          { id: 'I.2.C.6.1', text: {
            fr: 'Des ajustements de l’arrangement de cogestion ont eu lieu sur la base des résultats du suivi-évaluation.',
            en: 'Adjustments to the co-management arrangement have taken place based on monitoring and evaluation results.' } },
        ],
      },
      {
        id: 'I.2.C.7',
        title: { fr: 'Établir des alliances et réseaux mutuellement bénéfiques', en: 'Establish mutually beneficial alliances and networks' },
        indicators: [
          { id: 'I.2.C.7.1', text: {
            fr: 'Des réseaux et alliances entre groupes d’usagers/parties prenantes sont en place et fonctionnels.',
            en: 'Networks and alliances among various user groups/stakeholders are in place and functional.' } },
          { id: 'I.2.C.7.2', text: {
            fr: 'Les expériences et enseignements sont partagés entre groupes de parties prenantes.',
            en: 'Experiences and lessons learned are shared among stakeholder groups.' } },
        ],
      },
    ],
  },
  {
    id: 'I.2.D',
    title: {
      fr: 'Renforcement des capacités de gouvernance',
      en: 'Enhancing governance capabilities',
    },
    practices: [
      {
        id: 'I.2.D.1',
        title: { fr: 'Développer la capacité organisationnelle', en: 'Develop and enhance organizational capacity' },
        indicators: [
          { id: 'I.2.D.1.1', text: {
            fr: 'La cogestion permet des mesures supplémentaires de soutien aux participants en cas de changements majeurs et structurels affectant la filière.',
            en: 'Co-management allows for extra measures in support of participants in the event of major and structural changes affecting the aquaculture industry.' } },
          { id: 'I.2.D.1.2', text: {
            fr: 'Le plan/processus de cogestion est adaptable pour soutenir les membres face à ces changements majeurs.',
            en: 'The co-management plan/process/arrangement is adaptable to support members in the event of major and structural changes affecting the industry.' } },
        ],
      },
      {
        id: 'I.2.D.2',
        title: { fr: 'Développer la dynamique d’innovation', en: 'Develop and enhance innovation drive' },
        indicators: [
          { id: 'I.2.D.2.1', text: {
            fr: 'Le plan de cogestion encourage et vise activement à lever les obstacles à l’adoption de nouvelles technologies.',
            en: 'The co-management plan encourages and actively aims to address barriers to the uptake of new technologies.' } },
          { id: 'I.2.D.2.2', text: {
            fr: 'Les participants établissent de nouvelles pratiques, développent de nouveaux produits ou recherchent de nouveaux partenariats conformément au plan.',
            en: 'Participants establish new practices, develop new products or seek out new partnerships in line with goals set out in the co-management plan.' } },
        ],
      },
      {
        id: 'I.2.D.3',
        title: { fr: 'Développer la capacité de changement d’échelle', en: 'Develop and enhance capacity for rescaling' },
        indicators: [
          { id: 'I.2.D.3.1', text: {
            fr: 'Une intensification des contacts avec des acteurs publics et privés est observable.',
            en: 'Increases in the level of outreach to actors — both public and private — are observable.' } },
          { id: 'I.2.D.3.2', text: {
            fr: 'Il existe des preuves claires de plaidoyer des participants sur les enjeux clés qui contraignent les activités aquacoles.',
            en: 'There is clear evidence of advocacy by participants on key issues that constrain aquaculture activities.' } },
        ],
      },
      {
        id: 'I.2.D.4',
        title: { fr: 'Développer la capacité de réflexivité', en: 'Develop and enhance capacity for reflexivity' },
        indicators: [
          { id: 'I.2.D.4.1', text: {
            fr: 'Les moments de suivi et d’évaluation débouchent sur des points d’action repris par les participants.',
            en: 'Moments of monitoring and assessment result in action points that are taken up by participants.' } },
        ],
      },
    ],
  },
  {
    id: 'I.3',
    title: {
      fr: 'Participants à la cogestion (pratiques individuelles)',
      en: 'Co-management participants (individual good practices)',
    },
    practices: [
      {
        id: 'I.3.1',
        title: { fr: 'Sensibilisation', en: 'Sensitization' },
        indicators: [
          { id: 'I.3.1.1', text: {
            fr: 'Les pisciculteurs étendent leurs décisions et pratiques d’élevage aux risques et ressources partagés au-delà de leur propre exploitation.',
            en: 'Farmers extend their decision-making and farming practices to consider shared risks and resources beyond their own farm.' } },
        ],
      },
      {
        id: 'I.3.2',
        title: { fr: 'Incitations', en: 'Incentives' },
        indicators: [
          { id: 'I.3.2.1', text: {
            fr: 'Les individus ont des incitations (économiques, sociales, politiques) à participer à la cogestion et à respecter volontairement ses règles et décisions.',
            en: 'Individuals have incentives (economic, social and political) to participate in co-management and voluntarily comply with its rules and decisions.' } },
          { id: 'I.3.2.2', text: {
            fr: 'Des incitations gouvernementales sont disponibles pour que les individus et groupes participent positivement à la cogestion.',
            en: 'Incentives from government are available for individuals and stakeholder groups to positively participate in co-management.' } },
        ],
      },
      {
        id: 'I.3.3',
        title: { fr: 'Redevabilité', en: 'Accountability' },
        indicators: [
          { id: 'I.3.3.1', text: {
            fr: 'Les individus assument leurs propres responsabilités.',
            en: 'Individuals act upon their own responsibilities.' } },
          { id: 'I.3.3.2', text: {
            fr: 'Les individus se soumettent à la redevabilité dans les conditions fixées par l’accord et le plan de cogestion.',
            en: 'Individuals subject themselves to accountability under the conditions set out by the ACM agreement and plan.' } },
        ],
      },
      {
        id: 'I.3.4',
        title: { fr: 'Équité', en: 'Equitability' },
        indicators: [
          { id: 'I.3.4.1', text: {
            fr: 'Les individus font preuve d’équité dans la gestion des risques et ressources partagés.',
            en: 'Individuals demonstrate equitable decision-making in the management of shared risks and resources.' } },
          { id: 'I.3.4.2', text: {
            fr: 'Les participants comprennent et acceptent le rôle de leurs pairs et soutiennent la répartition des bénéfices prévue par le plan.',
            en: 'Participants understand and agree with the role of their peers and support the distribution of the benefits according to the co-management plan.' } },
        ],
      },
      {
        id: 'I.3.5',
        title: { fr: 'Réflexivité', en: 'Reflexivity' },
        indicators: [
          { id: 'I.3.5.1', text: {
            fr: 'Les individus s’engagent activement dans le plan de cogestion et un changement observable de leurs pratiques en résulte.',
            en: 'Individuals actively engage with the co-management plan and there is observable change in their practices.' } },
        ],
      },
    ],
  },
];

// Flat list of scoreable indicators (criterion_id used by the assessments table).
export const dacmsIndicators = dacmsSections.flatMap((s) =>
  s.practices.flatMap((p) =>
    p.indicators.map((i) => ({ ...i, practiceId: p.id, sectionId: s.id }))));

// Typologies from the guidebook (cd1410en) — used as form enums.
export const ACM_GROUP_TYPES = [
  { id: 'committee',   fr: 'Comité de cogestion', en: 'Co-management committee' },
  { id: 'cooperative', fr: 'Coopérative',         en: 'Cooperative' },
  { id: 'association', fr: 'Association de producteurs', en: 'Producer association' },
  { id: 'network',     fr: 'Réseau / plateforme', en: 'Network / platform' },
];
export const ACM_MODELS = [ // guidebook §3.3
  { id: 'communal',      fr: 'Communal',       en: 'Communal' },
  { id: 'collective',    fr: 'Collectif',      en: 'Collective' },
  { id: 'zonal',         fr: 'Zonal',          en: 'Zonal' },
  { id: 'intersectoral', fr: 'Intersectoriel', en: 'Inter-sectoral' },
];
export const ACM_DEGREES = [ // guidebook §3.2 (after Sen & Nielsen)
  { id: 'instructive',  fr: 'Instructif',   en: 'Instructive' },
  { id: 'consultative', fr: 'Consultatif',  en: 'Consultative' },
  { id: 'cooperative',  fr: 'Coopératif',   en: 'Cooperative' },
  { id: 'delegated',    fr: 'Délégué',      en: 'Delegated' },
];
export const INDICATOR_CATEGORIES = [ // Annex 2 goal categories
  { id: 'social',     fr: 'Social',        en: 'Social' },
  { id: 'economic',   fr: 'Économique',    en: 'Economic' },
  { id: 'ecological', fr: 'Écologique',    en: 'Ecological' },
  { id: 'governance', fr: 'Gouvernance',   en: 'Governance' },
];
export const ZONE_TYPES = [ // Annex I.1.2.1 exclusion-zone examples + EAA zoning
  { id: 'comanaged',    fr: 'Zone cogérée',           en: 'Co-managed area',     color: '#0D6B8A' },
  { id: 'conservation', fr: 'Zone de conservation',   en: 'Conservation area',   color: '#00A878' },
  { id: 'nursery',      fr: 'Zone de nurserie',       en: 'Nursery grounds',     color: '#F4A261' },
  { id: 'navigation',   fr: 'Voie de navigation',     en: 'Navigation route',    color: '#8b5cf6' },
  { id: 'other',        fr: 'Autre',                  en: 'Other',               color: '#64748b' },
];
export const CONFLICT_TYPES = [ // guidebook §6.1 step 14
  { id: 'producer_producer', fr: 'Producteur – producteur',      en: 'Producer – producer' },
  { id: 'producer_state',    fr: 'Producteur – État',            en: 'Producer – state' },
  { id: 'producer_external', fr: 'Producteur – non-participant', en: 'Producer – non-participant' },
];
