// assets/images/ImageAssets.ts

/**
 * 앱에서 사용하는 모든 정적 이미지 에셋을 중앙에서 관리합니다.
 * Metro 번들러가 프로덕션 빌드 시 모든 이미지를 안정적으로 포함하도록 보장합니다.
 */
export const ImageAssets = {
  // Survey - Travel Type
  travel_public: require('./public_transport.jpg'),
  travel_walking: require('./walking.jpg'),
  travel_car: require('./car.jpg'),

  // Survey - Companion
  companion_solo: require('./solo.jpg'),
  companion_couple: require('./couple.jpg'),
  companion_friends: require('./friends.jpg'),
  companion_family: require('./family.jpg'),

  // Survey - Adjectives (영문 파일명으로 변경된 기준)
  adjective_luxurious: require('./adjectives/icon_luxurious.png'),
  adjective_tranquil: require('./adjectives/icon_tranquil.png'),
  adjective_romantic: require('./adjectives/icon_romantic.png'),
  adjective_modern: require('./adjectives/icon_modern.png'),
  adjective_fresh: require('./adjectives/icon_fresh.png'),
  adjective_traditional: require('./adjectives/icon_traditional.png'),
  adjective_active: require('./adjectives/icon_active.png'),
  adjective_hip: require('./adjectives/icon_hip.png'),
  adjective_friendly: require('./adjectives/icon_friendly.png'),

  // Survey - Destination
  dest_restaurant: require('./restaurant.jpg'),
  dest_cafe: require('./cafe.jpg'),
  dest_accommodation: require('./accommodation.jpg'),
  dest_attractions: require('./attractions.jpg'),

  // Default Category Icons
  default_restaurants: require('./restaurants_icon.png'),
  default_cafes: require('./cafes_icon.png'),
  default_accommodations: require('./accommodations_icon.png'),
  default_attractions: require('./attractions_icon.png'),
};