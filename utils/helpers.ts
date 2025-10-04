  
  export const getCategoryFromName = (name: string) => {
    switch (name) {
      case 'all':
        return 'Tất cả';
      case 'foods':
        return 'Đồ ăn';
      case 'drinks':
        return 'Đồ uống';
      case 'fruits':
        return 'Hoa quả';
      case 'snacks':
        return 'Đồ ăn nhanh';
      case 'other' :
        return 'Khác';
    }
  };
  