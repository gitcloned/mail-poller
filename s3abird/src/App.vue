<template>
<div>
  <Header></Header>
  <div class="container bg-light mt-md-5 my-2 py-2 rounded">
    <keep-alive include="EmailList">
      <router-view></router-view>
    </keep-alive>
  </div>
  <footer class="container d-flex justify-content-between my-2">
    <span>Made with <i class="fas fa-heart"></i> by Decision Science</span>
  </footer>
</div>
</template>

<script>
const Header = require('./Header.vue');

module.exports = {
    name: 'App',
    components: {
        Header
    }
};
</script>

<style lang="scss" scoped>
footer {
    font-size: 0.875rem;

    color: rgba(#fff, .4);

    a {
        &:hover {
            color: rgba(#fff, 7);
        }

        color: inherit;
        text-decoration: none;
    }
}
</style>
