/**
 * Shared relief catalog seed. Used by the in-memory mock repositories (demo
 * mode) and mirrored by the SQL migration so both modes show the same catalog.
 * Category ids are stable slugs; product ids are generated at load for the mock.
 */

export interface SeedCategory {
  id: string;
  name: string;
}

export interface SeedProduct {
  categoryId: string;
  name: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { id: "alimentos", name: "Alimentos" },
  { id: "higiene", name: "Higiene Personal" },
  { id: "insumos_medicos", name: "Insumos Médicos" },
  { id: "medicamentos", name: "Medicamentos" },
  { id: "hogar", name: "Artículos del Hogar" },
  { id: "herramientas", name: "Herramientas" },
  { id: "ropa", name: "Ropa y Calzado" },
  { id: "cama", name: "Colchonetas y Ropa de Cama" },
  { id: "juguetes", name: "Juguetes" },
  { id: "colores", name: "Colores y Dibujos" },
  { id: "otros", name: "Otros" },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // Alimentos
  { categoryId: "alimentos", name: "Agua potable" },
  { categoryId: "alimentos", name: "Arroz" },
  { categoryId: "alimentos", name: "Pasta" },
  { categoryId: "alimentos", name: "Harina de maíz" },
  { categoryId: "alimentos", name: "Granos" },
  { categoryId: "alimentos", name: "Enlatados" },
  { categoryId: "alimentos", name: "Aceite" },
  { categoryId: "alimentos", name: "Azúcar" },
  { categoryId: "alimentos", name: "Sal" },
  { categoryId: "alimentos", name: "Café" },
  { categoryId: "alimentos", name: "Leche en polvo" },
  { categoryId: "alimentos", name: "Fórmulas para bebés" },
  { categoryId: "alimentos", name: "Cerelac" },
  { categoryId: "alimentos", name: "Compota" },
  { categoryId: "alimentos", name: "Huevos" },
  { categoryId: "alimentos", name: "Pollo" },
  { categoryId: "alimentos", name: "Tabletas purificadoras de agua" },
  // Higiene Personal
  { categoryId: "higiene", name: "Jabón de baño" },
  { categoryId: "higiene", name: "Shampoo" },
  { categoryId: "higiene", name: "Pasta dental" },
  { categoryId: "higiene", name: "Cepillo dental" },
  { categoryId: "higiene", name: "Desodorante" },
  { categoryId: "higiene", name: "Afeitadoras" },
  { categoryId: "higiene", name: "Pañales" },
  { categoryId: "higiene", name: "Toallas sanitarias" },
  { categoryId: "higiene", name: "Papel higiénico" },
  { categoryId: "higiene", name: "Antibacterial" },
  { categoryId: "higiene", name: "Tapabocas" },
  // Insumos Médicos
  { categoryId: "insumos_medicos", name: "Guantes" },
  { categoryId: "insumos_medicos", name: "Gasas" },
  { categoryId: "insumos_medicos", name: "Vendas" },
  { categoryId: "insumos_medicos", name: "Yesos" },
  { categoryId: "insumos_medicos", name: "Bisturí" },
  { categoryId: "insumos_medicos", name: "Suero oral" },
  { categoryId: "insumos_medicos", name: "Macrogoteros" },
  { categoryId: "insumos_medicos", name: "Inyectadoras" },
  { categoryId: "insumos_medicos", name: "Algodón" },
  { categoryId: "insumos_medicos", name: "Bata de quirófano" },
  { categoryId: "insumos_medicos", name: "Monos quirúrgicos" },
  // Medicamentos
  { categoryId: "medicamentos", name: "Antibióticos" },
  { categoryId: "medicamentos", name: "Acetaminofén" },
  { categoryId: "medicamentos", name: "Ibuprofeno" },
  { categoryId: "medicamentos", name: "Antialérgicos" },
  { categoryId: "medicamentos", name: "Cardiovasculares" },
  { categoryId: "medicamentos", name: "Pediátricos" },
  { categoryId: "medicamentos", name: "Suero fisiológico" },
  // Artículos del Hogar
  { categoryId: "hogar", name: "Cloro" },
  { categoryId: "hogar", name: "Desinfectante" },
  { categoryId: "hogar", name: "Detergente" },
  { categoryId: "hogar", name: "Bolsas de basura" },
  { categoryId: "hogar", name: "Velas" },
  { categoryId: "hogar", name: "Fósforos" },
  // Herramientas
  { categoryId: "herramientas", name: "Bombillos de emergencia" },
  { categoryId: "herramientas", name: "Linternas" },
  { categoryId: "herramientas", name: "Baterías" },
  { categoryId: "herramientas", name: "Lentes de seguridad" },
  { categoryId: "herramientas", name: "Guantes de trabajo" },
  { categoryId: "herramientas", name: "Mangueras (mínimo 5m)" },
  { categoryId: "herramientas", name: "Palas" },
  { categoryId: "herramientas", name: "Carpas" },
  // Ropa y Calzado
  { categoryId: "ropa", name: "Ropa" },
  { categoryId: "ropa", name: "Ropa para bebés" },
  { categoryId: "ropa", name: "Ropa interior de niñas" },
  { categoryId: "ropa", name: "Ropa interior de niños" },
  { categoryId: "ropa", name: "Zapatos" },
  { categoryId: "ropa", name: "Medias" },
  // Colchonetas y Ropa de Cama
  { categoryId: "cama", name: "Cobijas" },
  { categoryId: "cama", name: "Colchonetas" },
  { categoryId: "cama", name: "Sábanas" },
  { categoryId: "cama", name: "Almohadas" },
  // Juguetes
  { categoryId: "juguetes", name: "Juegos deportivos" },
  { categoryId: "juguetes", name: "Juegos lúdicos" },
  { categoryId: "juguetes", name: "Legos" },
  { categoryId: "juguetes", name: "Juguetes de niñas" },
  { categoryId: "juguetes", name: "Juguetes de niños" },
  // Colores y Dibujos
  { categoryId: "colores", name: "Creyones de madera" },
  { categoryId: "colores", name: "Cuadernos" },
  { categoryId: "colores", name: "Lápices" },
  { categoryId: "colores", name: "Hojas blancas" },
  { categoryId: "colores", name: "Pinta caritas" },
  // Otros
  { categoryId: "otros", name: "Envases de comida" },
  { categoryId: "otros", name: "Encendedor" },
  { categoryId: "otros", name: "Centro de camas" },
];
