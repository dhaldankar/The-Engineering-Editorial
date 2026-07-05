import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useCurrentProduct } from '../../contexts/CurrentProductContext';
import { listProducts } from '../../services/productsService';
import { routePaths } from '../../app/routePaths';

export function ProjectSwitcher() {
  const { product, setProductId } = useCurrentProduct();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
    enabled: open,
  });

  function handleSelect(id: string) {
    setAnchorEl(null);
    setProductId(id);
    navigate(routePaths.repositories());
  }

  return (
    <>
      <Button
        color="inherit"
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="Switch project"
      >
        {product?.name ?? 'Select project'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {(products ?? []).map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === product?.id}
            onClick={() => handleSelect(item.id)}
          >
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
