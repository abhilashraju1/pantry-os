import {
  Ingredient,
  StockLot,
  Dish,
  ProductionBatch,
  Equipment,
  Order,
  CashSession,
  UserProfile
} from '@pantryos/contracts';

export class MemoryStore {
  public organization = {
    id: 'org-01',
    name: 'Mandya Traditional Pantries Private Limited',
    slug: 'mandya-pantries'
  };

  public branch = {
    id: 'branch-blr-vvp-01',
    organizationId: 'org-01',
    name: 'VV Puram Food Street Branch',
    code: 'BLR-VVP-01',
    address: 'Food Street, Old Tharagupet, Bengaluru, Karnataka 560053',
    phone: '+91 80 2652 0001',
    gstRatePercent: 5
  };

  public users: UserProfile[] = [
    {
      id: 'usr-mgr-01',
      email: 'admin@pantryos.local',
      fullName: 'Suresh Kumar',
      phone: '+91 98450 11111',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
      branchId: 'branch-blr-vvp-01',
      organizationId: 'org-01',
      isActive: true
    },
    {
      id: 'usr-chef-01',
      email: 'chef@pantryos.local',
      fullName: 'Manjunath Bhat',
      phone: '+91 98450 22222',
      roles: ['CHEF'],
      branchId: 'branch-blr-vvp-01',
      organizationId: 'org-01',
      isActive: true
    },
    {
      id: 'usr-cash-01',
      email: 'cashier@pantryos.local',
      fullName: 'Deepa Gowda',
      phone: '+91 98450 33333',
      roles: ['CASHIER'],
      branchId: 'branch-blr-vvp-01',
      organizationId: 'org-01',
      isActive: true
    },
    {
      id: 'usr-pack-01',
      email: 'packer@pantryos.local',
      fullName: 'Ramesh Nayak',
      phone: '+91 98450 44444',
      roles: ['PACKER'],
      branchId: 'branch-blr-vvp-01',
      organizationId: 'org-01',
      isActive: true
    }
  ];

  public tables = [
    { id: 'tbl-01', tableNumber: 'T1', qrToken: 'token_t1_98a7f', seatingCapacity: 4, status: 'AVAILABLE' },
    { id: 'tbl-02', tableNumber: 'T2', qrToken: 'token_t2_11b3c', seatingCapacity: 2, status: 'OCCUPIED' },
    { id: 'tbl-03', tableNumber: 'T3', qrToken: 'token_t3_44c2d', seatingCapacity: 4, status: 'AVAILABLE' },
    { id: 'tbl-04', tableNumber: 'T4', qrToken: 'token_t4_77e8f', seatingCapacity: 6, status: 'AVAILABLE' },
    { id: 'tbl-05', tableNumber: 'T5', qrToken: 'token_t5_22d9a', seatingCapacity: 2, status: 'AVAILABLE' },
    { id: 'tbl-06', tableNumber: 'T6', qrToken: 'token_t6_55f1b', seatingCapacity: 4, status: 'AVAILABLE' }
  ];

  public equipment: Equipment[] = [
    {
      id: 'eq-burner-1',
      code: 'BURNER-01',
      nameEn: 'Commercial Gas Burner 1',
      nameKn: 'ವಾಣಿಜ್ಯ ಗ್ಯಾಸ್ ಬರ್ನರ್ ೧',
      stationId: 'stn-stove',
      stationNameEn: 'Main Stove Station',
      type: 'GAS_STOVE',
      status: 'AVAILABLE',
      isExclusive: true,
      currentTaskId: null,
      lockedUntil: null
    },
    {
      id: 'eq-burner-2',
      code: 'BURNER-02',
      nameEn: 'Commercial Gas Burner 2',
      nameKn: 'ವಾಣಿಜ್ಯ ಗ್ಯಾಸ್ ಬರ್ನರ್ ೨',
      stationId: 'stn-stove',
      stationNameEn: 'Main Stove Station',
      type: 'GAS_STOVE',
      status: 'AVAILABLE',
      isExclusive: true,
      currentTaskId: null,
      lockedUntil: null
    },
    {
      id: 'eq-tawa-1',
      code: 'TAWA-01',
      nameEn: 'Heavy Cast Iron Akki Rotti Tawa 1',
      nameKn: 'ಭಾರವಾದ ಬೀಡು ಕಬ್ಬಿಣದ ಅಕ್ಕಿ ರೊಟ್ಟಿ ಹಂಚು ೧',
      stationId: 'stn-tawa',
      stationNameEn: 'Tawa Griddle Station',
      type: 'TAWA',
      status: 'AVAILABLE',
      isExclusive: true,
      currentTaskId: null,
      lockedUntil: null
    },
    {
      id: 'eq-warmer-1',
      code: 'WARMER-01',
      nameEn: 'Thermal Holding Warmer Pot 1',
      nameKn: 'ಉಷ್ಣತೆ ಕಾಯ್ದಿರಿಸುವ ಆಹಾರ ಪಾತ್ರೆ ೧',
      stationId: 'stn-holding',
      stationNameEn: 'Holding Station',
      type: 'WARMER',
      status: 'OCCUPIED',
      isExclusive: false,
      currentTaskId: 'batch-bbb-01',
      lockedUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString()
    }
  ];

  public ingredients: Ingredient[] = [
    {
      id: 'ing-rice',
      code: 'ING-001',
      nameEn: 'Sona Masoori Rice',
      nameKn: 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ',
      category: 'GRAINS',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 10000,
      currentStock: 45000,
      storageLocation: 'Dry Storage Shelf A'
    },
    {
      id: 'ing-toor-dal',
      code: 'ING-002',
      nameEn: 'Toor Dal',
      nameKn: 'ತೊಗರಿ ಬೇಳೆ',
      category: 'PULSES',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 5000,
      currentStock: 22000,
      storageLocation: 'Dry Storage Shelf B'
    },
    {
      id: 'ing-rice-flour',
      code: 'ING-003',
      nameEn: 'Fine Rice Flour',
      nameKn: 'ಅಕ್ಕಿ ಹಿಟ್ಟು',
      category: 'FLOURS',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 8000,
      currentStock: 25000,
      storageLocation: 'Dry Storage Shelf C'
    },
    {
      id: 'ing-greens',
      code: 'ING-005',
      nameEn: 'Fresh Leafy Greens (Dantu/Sabsige)',
      nameKn: 'ತಾಜಾ ಸೊಪ್ಪು (ದಂಟು/ಸಬ್ಬಸಿಗೆ)',
      category: 'VEGETABLES',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 2000,
      currentStock: 8500,
      storageLocation: 'Cool Produce Bin 1'
    },
    {
      id: 'ing-onion',
      code: 'ING-006',
      nameEn: 'Onion',
      nameKn: 'ಈರುಳ್ಳಿ',
      category: 'VEGETABLES',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 5000,
      currentStock: 30000,
      storageLocation: 'Vegetable Crate 1'
    },
    {
      id: 'ing-tomato',
      code: 'ING-007',
      nameEn: 'Tomato',
      nameKn: 'ಟೊಮೆಟೊ',
      category: 'VEGETABLES',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 3000,
      currentStock: 15000,
      storageLocation: 'Vegetable Crate 2'
    },
    {
      id: 'ing-coconut',
      code: 'ING-011',
      nameEn: 'Fresh Grated Coconut',
      nameKn: 'ತೆಂಗಿನಕಾಯಿ ತುರಿ',
      category: 'PERISHABLES',
      baseUnit: 'g',
      purchaseUnit: 'kg',
      conversionRatioToBase: 1000,
      reorderLevel: 1000,
      currentStock: 4500,
      storageLocation: 'Chiller Shelf 1'
    },
    {
      id: 'ing-oil',
      code: 'ING-021',
      nameEn: 'Sunflower Cooking Oil',
      nameKn: 'ಅಡುಗೆ ಎಣ್ಣೆ',
      category: 'OILS',
      baseUnit: 'ml',
      purchaseUnit: 'l',
      conversionRatioToBase: 1000,
      reorderLevel: 5000,
      currentStock: 18000,
      storageLocation: 'Oil Drum Rack'
    },
    {
      id: 'ing-pkg-container',
      code: 'PKG-001',
      nameEn: '250ml Biodegradable Food Container',
      nameKn: '೨೫೦ ಮಿಲಿ ಪರಿಸರಸ್ನೇಹಿ ಡಬ್ಬಿ',
      category: 'PACKAGING',
      baseUnit: 'pcs',
      purchaseUnit: 'pack',
      conversionRatioToBase: 50,
      reorderLevel: 50,
      currentStock: 350,
      storageLocation: 'Packaging Shelf 1'
    }
  ];

  public stockLots: StockLot[] = [
    {
      id: 'lot-rice-01',
      lotNumber: 'LOT-RICE-202611-01',
      ingredientId: 'ing-rice',
      initialQuantity: 50000,
      availableQuantity: 45000,
      reservedQuantity: 0,
      unitCostPaise: 6, // 6 paise per gram = ₹60/kg
      receivedAt: '2026-11-10T08:00:00.000Z',
      expiresAt: '2027-05-10T08:00:00.000Z',
      status: 'AVAILABLE'
    },
    {
      id: 'lot-dal-01',
      lotNumber: 'LOT-DAL-202611-01',
      ingredientId: 'ing-toor-dal',
      initialQuantity: 25000,
      availableQuantity: 22000,
      reservedQuantity: 0,
      unitCostPaise: 16, // ₹160/kg
      receivedAt: '2026-11-12T09:00:00.000Z',
      expiresAt: '2027-05-12T09:00:00.000Z',
      status: 'AVAILABLE'
    }
  ];

  public dishes: Dish[] = [
    {
      id: 'dish-bassaru',
      code: 'DISH-BAS',
      nameEn: 'Bassaru (Broth & Palya)',
      nameKn: 'ಬಸ್ಸಾರು (ಸೊಪ್ಪಿನ ಸಾರು ಮತ್ತು ಪಲ್ಯ)',
      descriptionEn: 'Strained toor dal & greens broth tempered with spices, served with palya',
      descriptionKn: 'ತೊಗರಿ ಬೇಳೆ ಮತ್ತು ಸೊಪ್ಪಿನ ಬಸ್ಸಾರು, ಒಗ್ಗರಣೆ ಪಲ್ಯ ಮತ್ತು ರಾಗಿ ಮುದ್ದೆ ಜೊತೆ',
      preparationPolicy: 'READY_BATCH',
      recipeId: 'rcp-bassaru',
      activeVersionId: 'rcp-v-bassaru-01',
      imageUrl: '/demo-media/dishes/bassaru.webp',
      isActive: true,
      allergens: ['MUSTARD'],
      variants: [
        {
          id: 'var-bassaru-reg',
          nameEn: 'Regular Serving (250 ml)',
          nameKn: 'ಸಾಮಾನ್ಯ ಪ್ರಮಾಣ (೨೫೦ ಮಿಲಿ)',
          portionQuantity: 250,
          portionUnit: 'ml',
          pricePaise: 6500, // ₹65.00
          packagingItemId: 'ing-pkg-container'
        }
      ]
    },
    {
      id: 'dish-bbb',
      code: 'DISH-BBB',
      nameEn: 'Bisi Bele Bath',
      nameKn: 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್',
      descriptionEn: 'Mysore authentic spicy rice, dal & vegetable pot with pure ghee',
      descriptionKn: 'ತರಕಾರಿ, ಬೇಳೆ, ಅಕ್ಕಿ ಮತ್ತು ತುಪ್ಪದ ಒಗ್ಗರಣೆಯ ರುಚಿಕರ ಬಿಸಿ ಬೇಳೆ ಬಾತ್',
      preparationPolicy: 'READY_BATCH',
      recipeId: 'rcp-bbb',
      activeVersionId: 'rcp-v-bbb-01',
      imageUrl: '/demo-media/dishes/bisi-bele-bath.webp',
      isActive: true,
      allergens: ['DAIRY', 'MUSTARD'],
      variants: [
        {
          id: 'var-bbb-reg',
          nameEn: 'Regular Plate (300 g)',
          nameKn: 'ಸಾಮಾನ್ಯ ತಟ್ಟೆ (೩೦೦ ಗ್ರಾಂ)',
          portionQuantity: 300,
          portionUnit: 'g',
          pricePaise: 9000, // ₹90.00
          packagingItemId: 'ing-pkg-container'
        }
      ]
    },
    {
      id: 'dish-akki-rotti',
      code: 'DISH-ROTTI',
      nameEn: 'Akki Rotti (2 Pieces)',
      nameKn: 'ಅಕ್ಕಿ ರೊಟ್ಟಿ (೨ ರೊಟ್ಟಿ)',
      descriptionEn: 'Crispy rice flour flatbread with onion, chillies & fresh coconut chutney',
      descriptionKn: 'ಈರುಳ್ಳಿ, ಮೆಣಸಿನಕಾಯಿ ಮತ್ತು ಕೊತ್ತಂಬರಿಯ ಗರಿಗರಿ ಅಕ್ಕಿ ರೊಟ್ಟಿ, ತೆಂಗಿನಕಾಯಿ ಚಟ್ನಿ ಜೊತೆ',
      preparationPolicy: 'FRESH_ORDER',
      recipeId: 'rcp-rotti',
      activeVersionId: 'rcp-v-rotti-01',
      imageUrl: '/demo-media/dishes/akki-rotti.webp',
      isActive: true,
      allergens: [],
      variants: [
        {
          id: 'var-rotti-pair',
          nameEn: '2 Pieces + Chutney',
          nameKn: '೨ ರೊಟ್ಟಿಗಳು + ಚಟ್ನಿ',
          portionQuantity: 2,
          portionUnit: 'pcs',
          pricePaise: 8000, // ₹80.00
          packagingItemId: 'ing-pkg-container'
        }
      ]
    }
  ];

  public batches: ProductionBatch[] = [
    {
      id: 'batch-bassaru-01',
      batchCode: 'BATCH-BAS-101',
      branchId: 'branch-blr-vvp-01',
      recipeVersionId: 'rcp-v-bassaru-01',
      dishId: 'dish-bassaru',
      status: 'READY',
      plannedYield: 2500,
      actualUsableYield: 2500,
      remainingUsableYield: 2000, // 2000ml remaining = 8 portions (2 reserved)
      yieldUnit: 'ml',
      assignedEquipmentId: 'eq-burner-1',
      assignedChefId: 'usr-chef-01',
      currentStepId: null,
      stepStartedAt: null,
      cookedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 3.25 * 3600 * 1000).toISOString(),
      qualityApprovedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      qualityApprovedBy: 'usr-chef-01',
      qualityCoreTemperatureC: 82.5,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'batch-bbb-01',
      batchCode: 'BATCH-BBB-102',
      branchId: 'branch-blr-vvp-01',
      recipeVersionId: 'rcp-v-bbb-01',
      dishId: 'dish-bbb',
      status: 'READY',
      plannedYield: 3000,
      actualUsableYield: 3120,
      remainingUsableYield: 1800, // 1800g remaining = 6 portions (4 reserved)
      yieldUnit: 'g',
      assignedEquipmentId: 'eq-warmer-1',
      assignedChefId: 'usr-chef-01',
      currentStepId: null,
      stepStartedAt: null,
      cookedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      qualityApprovedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      qualityApprovedBy: 'usr-chef-01',
      qualityCoreTemperatureC: 79.0,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    }
  ];

  public orders: Order[] = [
    {
      id: 'ord-1001',
      orderNumber: 'ORD-202611-1001',
      branchId: 'branch-blr-vvp-01',
      channel: 'PHONE_PICKUP',
      status: 'SCHEDULED',
      tableId: null,
      tableNumber: null,
      customerName: 'Anand Murthy',
      customerPhone: '+91 99887 66554',
      subtotalPaise: 27000, // 3 x ₹90.00 = ₹270.00
      taxPaise: 1350,       // 5% GST = ₹13.50
      packagingFeePaise: 1500, // 3 x ₹5 = ₹15.00
      totalPaise: 29850,    // ₹298.50
      paymentStatus: 'UNPAID',
      requestedPickupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      promisedReadyAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      placedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      completedAt: null,
      notes: 'Please pack spicy sambar extra',
      items: [
        {
          id: 'item-101',
          orderId: 'ord-1001',
          dishId: 'dish-bbb',
          dishNameEn: 'Bisi Bele Bath',
          dishNameKn: 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್',
          variantId: 'var-bbb-reg',
          variantNameEn: 'Regular Plate (300 g)',
          variantNameKn: 'ಸಾಮಾನ್ಯ ತಟ್ಟೆ (೩೦೦ ಗ್ರಾಂ)',
          quantity: 3,
          unitPricePaise: 9000,
          subtotalPaise: 27000,
          specialInstructions: 'Pack hot',
          allocatedBatchId: 'batch-bbb-01',
          status: 'PENDING'
        }
      ]
    }
  ];

  public cashSession: CashSession = {
    id: 'cs-01',
    branchId: 'branch-blr-vvp-01',
    cashierUserId: 'usr-cash-01',
    cashierName: 'Deepa Gowda',
    openingCashPaise: 200000, // ₹2,000.00 opening float
    expectedCashPaise: 200000,
    closingCashPaise: null,
    variancePaise: null,
    openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    closedAt: null,
    notes: 'Morning shift drawer open'
  };
}

export const store = new MemoryStore();
