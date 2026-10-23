// Deltas explicitamente confirmados para a revisão do cardápio em 23/10/2026.
// Imagens permanecem fora do Git. Ingredientes atuais de leitura incerta não são removidos.
export const reviewedDescriptions = {
  'X Tudo': 'Pão + carne + queijo + presunto + ovo + bacon + calabresa + tomate + alface + milho + ervilha + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'X Burguer': 'Pão + carne + queijo + presunto + tomate + alface + milho + ervilha + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'Hambúrguer': 'Pão + carne + queijo + tomate + alface + molho + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'X Bacon': 'Pão + carne + queijo + presunto + bacon + tomate + alface + milho + ervilha + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'X Calabresa': 'Pão + carne + queijo + presunto + calabresa + cebola + tomate + alface + milho + ervilha + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'X Salada': 'Pão + carne + queijo + presunto + tomate + alface + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'X Duplo': 'Pão + 2 carnes + 2 ovos + 2 bacon + 2 calabresas + 2 queijos + 2 presuntos + tomate + alface + milho + ervilha + molho Billy Jack + maionese temperada + ketchup + batata palha',
  'Batata Maluca P': 'Batata + linguiça + calabresa + molhos + ketchup + queijo ralado',
  'Batata Maluca G': 'Porção grande de batata + linguiça + calabresa + molhos + ketchup + queijo ralado',
  'Combo 04': '3 X-Tudo podrão + 1 Batata Maluca + ovos de codorna + 6 nuggets'
};
export function applyReviewedDescriptions(menu) {
  for (const section of menu) {
    if (!['hamburgueres', 'porcoes', 'combos'].includes(section.id)) continue;
    for (const item of section.items) {
      if (Object.hasOwn(reviewedDescriptions, item.name)) item.desc = reviewedDescriptions[item.name];
    }
  }
  return menu;
}
export function applyReviewedPhotos(photos) {
  const oldId = 'porcoes-batata-maluca-p';
  if (photos[oldId]) {
    photos['porcoes-batata-maluca-g'] = photos[oldId];
    delete photos[oldId];
  }
  const oldComboId = 'combos-combo-04';
  if (photos[oldComboId]) {
    photos['combos-combo-05'] = photos[oldComboId];
    delete photos[oldComboId];
  }
  return photos;
}
