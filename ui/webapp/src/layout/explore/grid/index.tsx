import isUndefined from 'lodash/isUndefined';
import { createEffect, createSignal, For, on, Show } from 'solid-js';

import { Group } from '../../../types';
import detectIfSafari from '../../../utils/detectIfSafari';
import generateColorsArray from '../../../utils/generateColorsArray';
import getCategoriesWithItems from '../../../utils/getCategoriesWithItems';
import { SubcategoryDetails } from '../../../utils/gridCategoryLayout';
import { CategoriesData, CategoryData } from '../../../utils/itemsDataGetter';
import Grid from './Grid';
import styles from './GridCategory.module.css';

interface Props {
  data: CategoriesData;
  categories_overridden?: string[];
  initialIsVisible: boolean;
  group?: string;
}

interface CatProps {
  index: number;
  catSectionNumber: number;
  bgColor: string;
  categoryName: string;
  isOverriden: boolean;
  content: CategoryData;
  isSafari: boolean;
}

const Category = (props: CatProps) => {
  const [subcategories, setSubcategories] = createSignal<SubcategoryDetails[]>();

  createEffect(
    () => {
      if (!isUndefined(props.content)) {
        const subcategoriesTmp: SubcategoryDetails[] = [];
        Object.keys(props.content).forEach((subcat: string) => {
          if (props.content[subcat].items.length !== 0) {
            subcategoriesTmp.push({
              name: subcat,
              itemsCount: props.content[subcat].itemsCount,
              itemsFeaturedCount: props.content[subcat].itemsFeaturedCount,
            });
          }
        });

        setSubcategories(subcategoriesTmp);
      }
    },
    { refer: true }
  );

  return (
    <Show when={!isUndefined(subcategories()) && subcategories()!.length > 0}>
      <div class="d-flex flex-row w-100 h-100">
        <div
          class={`text-white border border-3 border-white fw-medium border-start-0 d-flex flex-row align-items-center justify-content-end position-relative ${styles.catTitleTextWrapper}`}
          classList={{
            'border-top-0': props.index !== 0,
            'border-bottom-0': props.index === props.catSectionNumber,
          }}
          style={{ 'background-color': props.bgColor }}
        >
          <Show
            when={!props.isSafari}
            fallback={
              <div class={`position-absolute text-end ${styles.catTitle} ${styles.ellipsis}`}>
                <div class={`${styles.safariTitle}`}>{props.categoryName}</div>
              </div>
            }
          >
            <div class={`position-absolute text-end d-flex justify-content-end align-items-center ${styles.catTitle}`}>
              <div class={`${styles.ellipsis}`}>{props.categoryName}</div>
            </div>
          </Show>
        </div>

        <div class="d-flex flex-column flex-grow-1 align-items-stretch">
          <Grid
            categoryName={props.categoryName}
            isOverriden={props.isOverriden}
            subcategories={subcategories()!}
            initialCategoryData={props.content}
            backgroundColor={props.bgColor}
            categoryIndex={props.index}
          />
        </div>
      </div>
    </Show>
  );
};

const GridCategory = (props: Props) => {
  const [colorsList, setColorsList] = createSignal<string[]>([]);
  const [firstLoad, setFirstLoad] = createSignal<boolean>(false);
  const [isVisible, setIsVisible] = createSignal<boolean>(false);
  const [catWithItems, setCatWithItems] = createSignal<string[]>([]);
  const data = () => props.data;
  const isSafari = () => detectIfSafari();

  // Get category_rows configuration for the current group
  const getCategoryRows = (): string[][] | undefined => {
    if (isUndefined(props.group) || isUndefined(window.baseDS.groups)) {
      return undefined;
    }
    const groupConfig = window.baseDS.groups.find(
      (g: Group) => g.normalized_name === props.group
    );
    return groupConfig?.category_rows;
  };

  // Build category rows based on category_rows configuration
  const buildCategoryRows = (): string[][] => {
    const catsWithItems = catWithItems();
    const categoryRows = getCategoryRows();

    if (isUndefined(categoryRows) || categoryRows.length === 0) {
      // Default: one category per row
      return catsWithItems.map((cat) => [cat]);
    }

    // Build rows from configuration, filtering out categories that don't have items
    const rows: string[][] = [];
    const usedCategories = new Set<string>();

    for (const row of categoryRows) {
      const categoriesInRow = row.filter((cat) => catsWithItems.includes(cat));
      if (categoriesInRow.length > 0) {
        rows.push(categoriesInRow);
        categoriesInRow.forEach((cat) => usedCategories.add(cat));
      }
    }

    // Add any categories not in category_rows configuration
    for (const cat of catsWithItems) {
      if (!usedCategories.has(cat)) {
        rows.push([cat]);
      }
    }

    return rows;
  };

  // Get color index for a category (based on its position in catWithItems)
  const getColorIndex = (categoryName: string): number => {
    const cats = catWithItems();
    return cats.indexOf(categoryName);
  };

  createEffect(() => {
    if (props.initialIsVisible !== isVisible()) {
      setIsVisible(props.initialIsVisible);
      if (props.initialIsVisible && !firstLoad()) {
        setFirstLoad(true);
      }
    }
  });

  createEffect(
    on(data, () => {
      if (!isUndefined(data())) {
        setColorsList(generateColorsArray(Object.keys(data()).length));
        setCatWithItems(getCategoriesWithItems(data()));
      }
    })
  );

  return (
    <Show when={firstLoad()}>
      <For each={buildCategoryRows()}>
        {(rowCategories) => {
          const numCatsInRow = rowCategories.length;
          // Render categories in this row horizontally
          return (
            <div class="d-flex flex-row w-100">
              <For each={rowCategories}>
                {(cat) => {
                  const catIndex = getColorIndex(cat);
                  const isOverriden = !isUndefined(props.categories_overridden) && props.categories_overridden.includes(cat);
                  const allCats = catWithItems();

                  return (
                    <div
                      class="d-flex flex-row"
                      style={{ width: numCatsInRow > 1 ? `${100 / numCatsInRow}%` : '100%' }}
                    >
                      <Category
                        index={catIndex}
                        isOverriden={isOverriden}
                        categoryName={cat}
                        bgColor={[...colorsList()][catIndex]}
                        catSectionNumber={allCats.length - 1}
                        content={data()[cat]}
                        isSafari={isSafari()}
                      />
                    </div>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>
    </Show>
  );
};

export default GridCategory;
