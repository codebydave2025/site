import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Star, Package, Users, ChevronDown, Plus, Minus } from 'lucide-react';
import { MenuItem } from '../data/menu';
import styles from './MenuCard.module.css';
import { useCart } from '../context/CartContext';

interface MenuCardProps {
    item: MenuItem;
    mealGroup?: string;
    setMealGroup?: (val: string) => void;
    orderGroups?: string[];
    setOrderGroups?: (val: string[]) => void;
}

export default function MenuCard({ item, mealGroup, setMealGroup, orderGroups, setOrderGroups }: MenuCardProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [mealQty, setMealQty] = useState(1);
    const { addToCart, updateQuantity, cartItems, toggleFavorite, isFavorite } = useCart();

    const favoritestatus = isFavorite(item.id);
    const rating = item.rating || 5;

    const handleConfirmOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.available === false) return;

        // Add the food item with chosen quantity
        addToCart(item, mealQty, mealGroup);

        // Check if this group already has a takeaway pack
        const currentGroup = mealGroup || 'Order 1';
        const hasPackaging = cartItems.some(i => i.category === 'Packaging' && i.mealGroup === currentGroup);

        if (!hasPackaging) {
            // Automatically add "Big Takeaway" packaging ONLY if this group doesn't have one yet
            const pkgId = 'takeaway-big';
            const pkgName = 'Takeaway (Big)';
            const pkgPrice = 300;

            addToCart({
                id: pkgId,
                name: pkgName,
                price: pkgPrice,
                image: '/Fiesta Recyclable Plastic Microwavable Containers with Lid - M 650ml.jpg',
                category: 'Packaging'
            }, 1, mealGroup); // Add exactly one pack for this person
        }

        setShowOptions(false);
        setMealQty(1);
    };

    const addNewPerson = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (orderGroups && setOrderGroups && setMealGroup) {
            const nextGroup = `Order ${orderGroups.length + 1}`;
            setOrderGroups([...orderGroups, nextGroup]);
            setMealGroup(nextGroup);
        }
    };

    return (
        <div
            className={`${styles.card} ${item.available === false ? styles.unavailable : ''} ${showOptions ? styles.cardExpanded : ''}`}
            onClick={() => item.available !== false && setShowOptions(!showOptions)}
        >
            <div className={styles.imageContainer}>
                {item.isNew && item.available !== false && <span className={styles.newBadge}>NEW</span>}
                {item.available === false && <span className={styles.soldOutBadge}>SOLD OUT</span>}
                <button
                    className={styles.wishlistBtn}
                    aria-label="Add to wishlist"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                    }}
                >
                    <Heart size={16} fill={favoritestatus ? "#D32F2F" : "white"} color={favoritestatus ? "#D32F2F" : "white"} />
                </button>
                {item.available === false && (
                    <div className={styles.soldOutContainer}>
                        <span className={styles.soldOutText}>Sold Out</span>
                    </div>
                )}
                <Image
                    src={item.image}
                    alt={item.name}
                    width={300}
                    height={200}
                    className={styles.productImage}
                    unoptimized
                />
            </div>

            <div className={styles.content}>
                <div className={styles.topRow}>
                    <h3 className={styles.title}>{item.name}</h3>
                    <div className={styles.priceContainer}>
                        <span className={styles.price}>₦{item.price.toLocaleString()}</span>
                    </div>
                </div>

                <div className={styles.bottomRow}>
                    <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={12}
                                fill={i < rating ? "#FF7A00" : "none"}
                                color="#FF7A00"
                            />
                        ))}
                    </div>
                    <button
                        className={styles.orderBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (item.available !== false) setShowOptions(!showOptions);
                        }}
                        disabled={item.available === false}
                    >
                        {item.available === false ? 'Out of Stock' : (showOptions ? 'Close' : 'Select Options')}
                    </button>
                </div>

                {showOptions && item.available !== false && (
                    <div className={styles.optionsDropdown} onClick={(e) => e.stopPropagation()}>
                        {/* New Meal Quantity Section */}
                        <div className={styles.optionsSection}>
                            <h4 className={styles.optionsTitle}><ChevronDown size={14} /> Quantity</h4>
                            <div className={styles.quantityControls} style={{ justifyContent: 'center', background: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1.5px solid #eee' }}>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={(e) => { e.stopPropagation(); setMealQty(Math.max(1, mealQty - 1)); }}
                                >
                                    <Minus size={16} />
                                </button>
                                <span className={styles.qtyValue} style={{ fontSize: '1.2rem', padding: '0 1rem' }}>{mealQty}</span>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={(e) => { e.stopPropagation(); setMealQty(mealQty + 1); }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>


                        {orderGroups && (
                            <div className={styles.optionsSection}>
                                <h4 className={styles.optionsTitle}><Users size={14} /> Ordering for:</h4>
                                <div className={styles.groupGrid}>
                                    {orderGroups.map(group => (
                                        <button
                                            key={group}
                                            className={`${styles.groupOption} ${mealGroup === group ? styles.groupActive : ''}`}
                                            onClick={() => setMealGroup?.(group)}
                                        >
                                            {group}
                                        </button>
                                    ))}
                                    <button className={styles.addBtn} onClick={addNewPerson}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            className={styles.confirmAddBtn}
                            onClick={handleConfirmOrder}
                        >
                            {`Add to ${mealGroup || 'Order'}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
