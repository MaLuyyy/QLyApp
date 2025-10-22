  
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
  export const getStatusOrderFromName = (status: string) => {
    switch(status){
      case 'all':
        return 'Tất cả';
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'delivering':
        return 'Đang giao hàng';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled' :
        return 'Đã hủy';
    }
  }

  export const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#facc15'; // vàng
      case 'confirmed':
        return '#fb923c'; // cam
      case 'delivering':
        return '#93c5fd'; // xanh dương nhạt
      case 'completed':
        return '#4ade80'; // xanh lá
      case 'cancelled':
        return '#f87171'; // đỏ
      default:
        return '#9ca3af'; // xám
    }
  };
  
  